import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

// Helper function to format currency
export const formatCurrency = (amount: string, currency = "MXN") => {
  const numAmount = Number.parseFloat(amount);
  if (Number.isNaN(numAmount)) return `${currency}$0.00`;
  return `${currency}$${numAmount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Type guard to filter out nulls
function isNotNull<T>(v: T | null): v is T {
  return v !== null;
}

function TransactionSummaryPanel({
  transactions,
  categories,
  monthLabel,
}: {
  transactions: { categoryId?: number | null; amount: string }[];
  categories: { id: number; name: string; isIncome: boolean }[];
  monthLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Calculate expenses by category
  const expensesByCategory = transactions
    .map((transaction) => {
      const category = categories.find((c) => c.id === transaction.categoryId);
      if (!category || category.isIncome) return null;
      return {
        categoryName: category.name,
        amount: Number.parseFloat(transaction.amount) || 0,
      };
    })
    .filter(isNotNull)
    .reduce(
      (acc, { categoryName, amount }) => {
        if (!acc[categoryName]) acc[categoryName] = 0;
        acc[categoryName] += amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  const sortedExpenses = Object.entries(expensesByCategory).sort(
    ([, a], [, b]) => b - a,
  );
  const expensesTotal = sortedExpenses.reduce(
    (sum, [, amount]) => sum + amount,
    0,
  );

  // Calculate income by category
  const incomeByCategory = transactions
    .map((transaction) => {
      const category = categories.find((c) => c.id === transaction.categoryId);
      if (!category || !category.isIncome) return null;
      return {
        categoryName: category.name,
        amount: Number.parseFloat(transaction.amount) || 0,
      };
    })
    .filter(isNotNull)
    .reduce(
      (acc, { categoryName, amount }) => {
        if (!acc[categoryName]) acc[categoryName] = 0;
        acc[categoryName] += amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  const sortedIncome = Object.entries(incomeByCategory).sort(
    ([, a], [, b]) => b - a,
  );
  const incomeTotal = sortedIncome.reduce((sum, [, amount]) => sum + amount, 0);

  // Net income
  const netIncome = incomeTotal - expensesTotal;

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-end">
        <button
          type="button"
          className="ml-2 rounded-full border bg-white p-1 shadow transition hover:bg-muted"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex w-80 min-w-[18rem] max-w-xs flex-col gap-2 rounded-xl border bg-white p-4 shadow">
      {/* Header with collapse button */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
          {monthLabel} Resumen
        </span>
        <button
          type="button"
          className="ml-2 rounded-full border bg-white p-1 shadow transition hover:bg-muted"
          onClick={() => setCollapsed(true)}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="mb-2 border-b" />
      {/* Expenses */}
      <div className="mb-1 font-bold text-muted-foreground text-xs">GASTOS</div>
      <div className="mb-2 flex flex-col gap-1">
        {sortedExpenses.length > 0 ? (
          sortedExpenses.map(([category, amount]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="font-medium text-primary text-sm">
                {category}
              </span>
              <span className="font-mono text-red-600 text-sm">
                {formatCurrency(amount.toString())}
              </span>
            </div>
          ))
        ) : (
          <div className="py-2 text-muted-foreground text-sm">
            No hay gastos categorizados
          </div>
        )}
      </div>
      {/* Income */}
      <div className="mt-2 mb-1 font-bold text-muted-foreground text-xs">
        INGRESOS
      </div>
      <div className="mb-2 flex flex-col gap-1">
        {sortedIncome.length > 0 ? (
          sortedIncome.map(([category, amount]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="font-medium text-primary text-sm">
                {category}
              </span>
              <span className="font-mono text-green-600 text-sm">
                {formatCurrency(amount.toString())}
              </span>
            </div>
          ))
        ) : (
          <div className="py-2 text-muted-foreground text-sm">
            No hay ingresos categorizados
          </div>
        )}
      </div>
      <div className="my-2 border-t border-dashed" />
      <div className="flex justify-between font-semibold text-sm">
        <span>Total Gastos</span>
        <span className="font-mono text-red-600">
          {formatCurrency(expensesTotal.toString())}
        </span>
      </div>
      <div className="flex justify-between font-semibold text-sm">
        <span>Saldo Neto</span>
        <span
          className={`font-mono ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {formatCurrency(Math.abs(netIncome).toString())}
        </span>
      </div>
    </div>
  );
}

export default TransactionSummaryPanel;
