import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import * as React from "react";
import type { RecurringTransaction } from "@/features/dashboard/api/recurringTransactions";
import { formatCurrency } from "@/lib/utils";

interface TransactionSummaryPanelProps {
  transactions: { categoryId?: number | null; amount: string }[];
  categories: { id: number; name: string; isIncome: boolean }[];
  monthLabel: string;
  budgets?: Record<number, number>; // categoryId -> plannedAmount
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  recurringTransactions?: RecurringTransaction[];
}

function TransactionSummaryPanel({
  transactions,
  categories,
  monthLabel,
  budgets = {},
  collapsed,
  setCollapsed,
  recurringTransactions = [],
}: TransactionSummaryPanelProps) {
  // Aggregate totals by categoryId
  const categoryTotals: Record<number, number> = {};
  transactions.forEach((tx) => {
    if (tx.categoryId == null) return;
    const amount = Number(tx.amount) || 0;
    if (!categoryTotals[tx.categoryId]) categoryTotals[tx.categoryId] = 0;
    categoryTotals[tx.categoryId] += amount;
  });

  // Only categories with transactions
  const categoriesWithTx = categories.filter(
    (cat) => categoryTotals[cat.id] !== undefined,
  );
  const incomeCategories = categoriesWithTx.filter((c) => c.isIncome);
  const expenseCategories = categoriesWithTx.filter((c) => !c.isIncome);

  // Find uncategorized transactions (no category or category not found)
  const uncategorizedTotal = transactions
    .filter(
      (tx) =>
        !tx.categoryId || !categories.some((cat) => cat.id === tx.categoryId),
    )
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

  // Track which category's amount is hovered
  const [hoveredCategoryId, setHoveredCategoryId] = React.useState<
    number | null
  >(null);

  const renderCategoryRow = (cat: {
    id: number;
    name: string;
    isIncome: boolean;
  }) => {
    const total = categoryTotals[cat.id] || 0;
    const budget = budgets[cat.id];
    const percent = budget
      ? Math.min((Math.abs(total) / budget) * 100, 999)
      : null;
    // Determine progress bar color
    let progressColor = "bg-green-500";
    if (budget && !cat.isIncome) {
      if (percent !== null && percent < 75) progressColor = "bg-green-500";
      else if (percent !== null && percent < 100)
        progressColor = "bg-yellow-400";
      else if (percent !== null && percent >= 100) progressColor = "bg-red-500";
    } else if (budget && cat.isIncome) {
      progressColor = "bg-green-500";
    }
    return (
      <div key={cat.id} className="mb-2">
        <div className="flex items-center gap-2">
          <span className="min-w-[80px] flex-1 truncate font-medium text-primary text-sm">
            {cat.name}
          </span>
          <button
            type="button"
            className="min-w-[80px] cursor-pointer border-none bg-transparent text-right font-mono text-sm outline-none"
            onMouseEnter={() => setHoveredCategoryId(cat.id)}
            onMouseLeave={() => setHoveredCategoryId(null)}
            aria-label={
              budget ? `Mostrar porcentaje de ${cat.name}` : undefined
            }
            tabIndex={0}
          >
            {budget && hoveredCategoryId === cat.id && percent !== null
              ? `${percent.toFixed(0)}%`
              : formatCurrency(Math.abs(total))}
          </button>
        </div>
        {budget && (
          <div className="mt-1 flex items-center gap-2">
            <div className="relative h-3 w-full overflow-hidden rounded bg-gray-200">
              <div
                className={`absolute top-0 left-0 h-full ${progressColor} transition-all`}
                style={{ width: `${Math.min(percent ?? 0, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Totals
  const expensesTotal = expenseCategories.reduce(
    (sum, cat) => sum + Math.abs(categoryTotals[cat.id] || 0),
    0,
  );
  const incomeTotal = incomeCategories.reduce(
    (sum, cat) => sum + Math.abs(categoryTotals[cat.id] || 0),
    0,
  );
  const netIncome = incomeTotal - expensesTotal;

  // Calculate recurring transactions for current month
  const currentMonthRecurring = recurringTransactions.filter((rt) => {
    if (!rt.isActive) return false;
    const startDate = new Date(rt.startDate);
    const endDate = rt.endDate ? new Date(rt.endDate) : null;
    const now = new Date();

    // Check if recurring transaction is active for current month
    if (startDate > now) return false;
    if (endDate && endDate < now) return false;

    return true;
  });

  const recurringIncomeTotal = currentMonthRecurring
    .filter((rt) => rt.type === "income")
    .reduce((sum, rt) => sum + Number(rt.amount), 0);

  const recurringExpenseTotal = currentMonthRecurring
    .filter((rt) => rt.type === "expense")
    .reduce((sum, rt) => sum + Number(rt.amount), 0);

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
    <div className="relative flex w-[260px] min-w-[260px] max-w-[260px] flex-col gap-2 rounded-xl border bg-white p-4 shadow">
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

      {/* Recurring Transactions Section */}
      {currentMonthRecurring.length > 0 && (
        <>
          <div className="mb-1 flex items-center gap-1 font-bold text-muted-foreground text-xs">
            <Repeat className="h-3 w-3" />
            RECURRING ITEMS
          </div>
          {currentMonthRecurring.map((rt) => (
            <div key={rt.id} className="flex justify-between text-sm">
              <span className="truncate">{rt.description}</span>
              <span
                className={`font-mono ${rt.type === "income" ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(Number(rt.amount))}
              </span>
            </div>
          ))}
          <div className="mb-2 border-b" />
        </>
      )}

      {/* Income */}
      <div className="mb-1 font-bold text-muted-foreground text-xs">
        INGRESOS
      </div>
      {incomeCategories.map((cat) => {
        const total = categoryTotals[cat.id] || 0;
        const budget = budgets[cat.id];
        const percent = budget ? (Math.abs(total) / budget) * 100 : null;
        const progressColor =
          percent && percent >= 100 ? "bg-green-500" : "bg-green-300";

        return renderCategoryRow(
          cat,
          total,
          budget,
          percent,
          progressColor,
          true,
        );
      })}

      {/* Expenses */}
      <div className="mb-1 mt-4 font-bold text-muted-foreground text-xs">
        GASTOS
      </div>
      {expenseCategories.map((cat) => {
        const total = categoryTotals[cat.id] || 0;
        const budget = budgets[cat.id];
        const percent = budget ? (Math.abs(total) / budget) * 100 : null;
        const progressColor =
          percent && percent >= 100 ? "bg-red-500" : "bg-red-300";

        return renderCategoryRow(
          cat,
          total,
          budget,
          percent,
          progressColor,
          false,
        );
      })}

      {/* Uncategorized */}
      {uncategorizedTotal > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sin categoría</span>
          <span className="font-mono text-muted-foreground">
            {formatCurrency(uncategorizedTotal)}
          </span>
        </div>
      )}

      {/* Totals */}
      <div className="mt-4 space-y-1 border-t pt-2">
        <div className="flex justify-between font-semibold text-sm">
          <span>Total Ingresos</span>
          <span className="font-mono text-green-600">
            {formatCurrency(incomeTotal)}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-sm">
          <span>Total Gastos</span>
          <span className="font-mono text-red-600">
            {formatCurrency(expensesTotal)}
          </span>
        </div>
        {(recurringIncomeTotal > 0 || recurringExpenseTotal > 0) && (
          <>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Recurring Income</span>
              <span className="font-mono text-green-500">
                {formatCurrency(recurringIncomeTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Recurring Expenses</span>
              <span className="font-mono text-red-500">
                {formatCurrency(recurringExpenseTotal)}
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between font-semibold text-sm">
          <span>Saldo Neto</span>
          <span
            className={`font-mono ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(Math.abs(netIncome))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TransactionSummaryPanel;
