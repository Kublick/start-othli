import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BudgetCategoryTable } from "@/components/budget-expenses-table";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useBudgets, useUpdateBudget } from "@/features/dashboard/api/budgets";
import { useActiveCategories } from "@/features/dashboard/api/categories";
import { useTransactions } from "@/features/dashboard/api/transactions";

export const Route = createFileRoute("/dashboard/finanzas/presupuestos")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      year: search.year as string | undefined,
      month: search.month as string | undefined,
    };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/dashboard/finanzas/presupuestos" });

  const getCurrentMonth = () => {
    if (search.year && search.month) {
      return new Date(
        Number.parseInt(search.year, 10),
        Number.parseInt(search.month, 10) - 1,
        1,
      );
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const currentDate = getCurrentMonth();

  // Memoize the date calculations to ensure they only change when needed
  const { filters } = useMemo(() => {
    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const end = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    const transactionFilters = {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };

    return {
      filters: transactionFilters,
    };
  }, [currentDate]);

  // Filter transactions for current month
  const { data } = useTransactions(filters);
  const transactions = data?.transactions || [];

  // Debug logging
  console.log("Current date:", currentDate);
  console.log("Filters:", filters);
  console.log("Transactions count:", transactions.length);

  const { data: categories = [] } = useActiveCategories();

  // Fetch budgets from backend for the selected month
  const budgetFilters = {
    year: String(currentDate.getFullYear()),
    month: String(currentDate.getMonth() + 1).padStart(2, "0"),
  };

  const { data: budgetData, isLoading: budgetsLoading } =
    useBudgets(budgetFilters);
  const backendBudgets = budgetData?.budgets || {};

  // Budget mutation
  const updateBudgetMutation = useUpdateBudget();

  // Local state for budgets (categoryId -> budgeted amount)
  const [localBudgets, setLocalBudgets] = useState<Record<number, number>>({});

  // Use backend budgets if available, otherwise use local budgets
  const budgets =
    Object.keys(backendBudgets).length > 0 ? backendBudgets : localBudgets;

  // Navigation functions
  const navigateToMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    const newYear = newDate.getFullYear();
    const newMonth = String(newDate.getMonth() + 1).padStart(2, "0");

    navigate({
      to: "/dashboard/finanzas/presupuestos",
      search: {
        year: String(newYear),
        month: newMonth,
      },
    });
  };

  const formatMonthYear = (date: Date) => {
    const formatted = date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Initialize URL with current month if no parameters
  useEffect(() => {
    if (!search.year || !search.month) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      navigate({
        to: "/dashboard/finanzas/presupuestos",
        search: {
          year: String(year),
          month: month,
        },
        replace: true,
      });
    }
  }, [search.year, search.month, navigate]);

  const handleBudgetChange = async (categoryId: number, value: number) => {
    try {
      // Update local state immediately for optimistic UI
      setLocalBudgets((prev) => ({ ...prev, [categoryId]: value }));

      // Save to backend with current month
      await updateBudgetMutation.mutateAsync({
        categoryId,
        amount: value,
        year: String(currentDate.getFullYear()),
        month: String(currentDate.getMonth() + 1).padStart(2, "0"),
      });

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
          {updateBudgetMutation.isPending && (
            <p className="mt-2 text-blue-600 text-sm">Guardando cambios...</p>
          )}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold text-lg">
              {formatMonthYear(currentDate)}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <BudgetCategoryTable
          key={`income-${currentDate.getFullYear()}-${currentDate.getMonth()}`}
          type="income"
          categories={categories}
          transactions={transactions}
          budgets={budgets}
          onBudgetChange={handleBudgetChange}
        />
        <BudgetCategoryTable
          key={`expense-${currentDate.getFullYear()}-${currentDate.getMonth()}`}
          type="expense"
          categories={categories}
          transactions={transactions}
          budgets={budgets}
          onBudgetChange={handleBudgetChange}
        />

        {/* Category Transaction Summary */}
      </div>
    </DashboardLayout>
  );
}
