import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BudgetCategoryTable } from "@/components/budget-expenses-table";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useBudgets, useUpdateBudget } from "@/features/dashboard/api/budgets";
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

  // Fetch budgets from backend
  const { data: budgetData, isLoading: budgetsLoading } = useBudgets();
  const backendBudgets = budgetData?.budgets || {};

  // Budget mutation
  const updateBudgetMutation = useUpdateBudget();

  // Local state for budgets (categoryId -> budgeted amount)
  const [localBudgets, setLocalBudgets] = useState<Record<number, number>>({});

  // Use backend budgets if available, otherwise use local budgets
  const budgets =
    Object.keys(backendBudgets).length > 0 ? backendBudgets : localBudgets;

  const handleBudgetChange = async (categoryId: number, value: number) => {
    try {
      // Update local state immediately for optimistic UI
      setLocalBudgets((prev) => ({ ...prev, [categoryId]: value }));

      // Save to backend
      await updateBudgetMutation.mutateAsync({ categoryId, amount: value });

      console.log(`Budget saved: Category ${categoryId} = ${value}`);
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Error al guardar el presupuesto");

      // Revert local state on error
      setLocalBudgets((prev) => ({
        ...prev,
        [categoryId]: backendBudgets[categoryId] || 0,
      }));
    }
  };

  if (budgetsLoading) {
    return (
      <DashboardLayout title="Presupuestos">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Cargando presupuestos...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Presupuestos">
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 font-bold text-2xl">Presupuesto</h2>
          <p className="text-muted-foreground">
            Establece tu presupuesto mensual para cada categoría. La actividad
            se calcula automáticamente según tus transacciones del mes.
          </p>
          {Object.keys(backendBudgets).length > 0 && (
            <p className="mt-2 text-green-600 text-sm">
              ✓ Presupuestos cargados desde el servidor
            </p>
          )}
          {updateBudgetMutation.isPending && (
            <p className="mt-2 text-blue-600 text-sm">Guardando cambios...</p>
          )}
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
