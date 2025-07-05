import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";

import { useActiveAccounts } from "@/features/dashboard/api/accounts";
import {
  useActiveCategories,
  useCreateCategories,
} from "@/features/dashboard/api/categories";
import { useCreatePayee, usePayees } from "@/features/dashboard/api/payees";
import {
  type Transaction,
  type TransactionFilters,
  type TransactionFormData,
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/features/dashboard/api/transactions";
import { TransactionSheet } from "@/features/dashboard/components/TransactionSheet";

import { TransactionTableTanstack } from "@/features/dashboard/components/TransactionTableTanstack";

export const Route = createFileRoute("/dashboard/finanzas/transacciones")({
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
  const search = useSearch({ from: "/dashboard/finanzas/transacciones" });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [formData, setFormData] = useState<TransactionFormData>({
    description: "",
    amount: "",
    type: "expense",
    currency: "USD",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    userAccountId: "",
    categoryId: undefined,
    payeeId: undefined,
  });

  const deleteTransactionMutation = useDeleteTransaction();

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
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  );

  const filters: TransactionFilters = {
    startDate: startOfMonth.toISOString().split("T")[0],
    endDate: endOfMonth.toISOString().split("T")[0],
  };

  const { mutateAsync: createCategory } = useCreateCategories();
  const { data: payees = [] } = usePayees();
  const { mutateAsync: createPayee } = useCreatePayee();

  // React Query hooks
  const { data, isLoading } = useTransactions(filters);
  const transactions = data?.transactions || [];

  const { data: accounts = [] } = useActiveAccounts();
  const { data: categories = [] } = useActiveCategories();
  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();

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
      to: "/dashboard/finanzas/transacciones",
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
        to: "/dashboard/finanzas/transacciones",
        search: {
          year: String(year),
          month: month,
        },
        replace: true,
      });
    }
  }, [search.year, search.month, navigate]);

  const handleCreateTransaction = () => {
    setEditingTransaction(null);
    setFormData({
      description: "",
      amount: "",
      type: "expense",
      currency: "mxn",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      userAccountId: accounts[0]?.id || "",
      categoryId: undefined,
      payeeId: undefined,
    });
    setIsSheetOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      currency: transaction.currency,
      date: new Date(transaction.date).toISOString().split("T")[0],
      notes: transaction.notes || "",
      userAccountId: transaction.userAccountId || "",
      categoryId: transaction.categoryId || undefined,
      payeeId: transaction.payeeId || undefined,
    });
    setIsSheetOpen(true);
  };

  const handleSaveTransaction = async () => {
    if (!formData.description.trim()) {
      toast.error("La descripción es requerida");
      return;
    }

    if (!formData.amount || Number.isNaN(Number.parseFloat(formData.amount))) {
      toast.error("El monto debe ser un número válido");
      return;
    }

    if (!formData.userAccountId) {
      toast.error("Debes seleccionar una cuenta");
      return;
    }

    try {
      if (editingTransaction) {
        // Update existing transaction
        await updateTransactionMutation.mutateAsync({
          id: editingTransaction.id,
          ...formData,
        });
      } else {
        // Create new transaction
        await createTransactionMutation.mutateAsync({
          transaction: formData,
        });
      }

      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error saving transaction:", error);
      // Error handling is done in the mutation
    }
  };

  const handleDeleteTransaction = async () => {
    if (!editingTransaction) return;
    try {
      await deleteTransactionMutation.mutateAsync({
        id: editingTransaction.id,
      });
      setIsSheetOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Transacciones">
        <div className="space-y-4">
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Transacciones">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl">Transacciones</h2>
            <p className="text-muted-foreground">
              Lleva el control de tus transacciones financieras
            </p>
          </div>
          <Button onClick={handleCreateTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Button>
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
            <p className="text-muted-foreground text-sm">
              {transactions.length} transacciones
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardContent className="pt-6">
            {transactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No hay transacciones para {formatMonthYear(currentDate)}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleCreateTransaction}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera transacción
                </Button>
              </div>
            ) : (
              <TransactionTableTanstack
                transactions={transactions}
                onOpenTransactionSheet={handleEditTransaction}
                createPayee={async (name) => {
                  await createPayee(name);
                }}
              />
            )}
          </CardContent>
        </Card>

        <TransactionSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          formData={formData}
          setFormData={setFormData}
          editingTransaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          payees={payees}
          createPayee={async (name) => {
            await createPayee(name);
          }}
          createCategory={async (name) => {
            await createCategory({
              categories: [
                {
                  name,
                  description: "",
                  isIncome: false,
                  excludeFromBudget: false,
                  excludeFromTotals: false,
                },
              ],
            });
          }}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
          deleteStatus={deleteTransactionMutation.status}
          saveLoading={
            createTransactionMutation.status === "pending" ||
            updateTransactionMutation.status === "pending"
          }
        />
      </div>
    </DashboardLayout>
  );
}
