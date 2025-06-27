import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BudgetCategoryTable } from "@/components/budget-expenses-table";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useActiveCategories } from "@/features/dashboard/api/categories";
import { useTransactions } from "@/features/dashboard/api/transactions";

export const Route = createFileRoute("/dashboard/finanzas/presupuestos")({
  component: RouteComponent,
});

function RouteComponent() {
  // Fetch categories and transactions for the current month
  const { data: categories = [] } = useActiveCategories();
  const { data } = useTransactions();
  const transactions = data?.transactions || [];

  // Local state for budgets (categoryId -> budgeted amount)
  const [budgets, setBudgets] = useState<Record<number, number>>({});

  const handleBudgetChange = (categoryId: number, value: number) => {
    setBudgets((prev) => ({ ...prev, [categoryId]: value }));
    // TODO: Persist budget to backend
  };

  return (
    <DashboardLayout title="Presupuestos">
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 font-bold text-2xl">Presupuesto</h2>
          <p className="text-muted-foreground">
            Establece tu presupuesto mensual para cada categoría. La actividad
            se calcula automáticamente según tus transacciones del mes.
          </p>
        </div>
        <BudgetCategoryTable
          type="income"
          categories={categories}
          transactions={transactions}
          budgets={budgets}
          onBudgetChange={handleBudgetChange}
        />
        <BudgetCategoryTable
          type="expense"
          categories={categories}
          transactions={transactions}
          budgets={budgets}
          onBudgetChange={handleBudgetChange}
        />
      </div>
    </DashboardLayout>
  );
}
