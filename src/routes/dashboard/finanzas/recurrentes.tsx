import { createFileRoute } from "@tanstack/react-router";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveAccounts } from "@/features/dashboard/api/accounts";
import { useActiveCategories } from "@/features/dashboard/api/categories";
import { usePayees } from "@/features/dashboard/api/payees";
import {
  // type RecurringTransactionFormData,
  useCreateRecurringTransaction,
  useDeleteRecurringTransaction,
  useRecurringTransactions,
  useUpdateRecurringTransaction,
} from "@/features/dashboard/api/recurringTransactions";
import { useTransactions } from "@/features/dashboard/api/transactions";
import RecurrentSheet from "@/features/dashboard/components/RecurrentSheet";

export const Route = createFileRoute("/dashboard/finanzas/recurrentes")({
  component: RouteComponent,
});

function RouteComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // const [formData, setFormData] = useState<RecurringTransactionFormData>({
  //   description: "",
  //   amount: "",
  //   type: "",
  //   currency: "MXN",
  //   frequency: "monthly",
  //   startDate: new Date().toISOString().split("T")[0],
  //   userAccountId: "",
  //   billingDate: new Date().toISOString().split("T")[0],
  // });

  // API hooks
  const { data: recurringTransactionsData } = useRecurringTransactions();
  const recurringTransactions =
    recurringTransactionsData?.recurringTransactions || [];
  const { data: accounts = [] } = useActiveAccounts();
  const { data: categories = [] } = useActiveCategories();
  const { data: payees = [] } = usePayees();
  const { data: transactionsData } = useTransactions({});
  const transactions = transactionsData?.transactions || [];

  const updateMutation = useUpdateRecurringTransaction();
  const deleteMutation = useDeleteRecurringTransaction();

  // Generate recurring instances for the current month
  const generateMonthlyInstances = () => {
    const instances = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (const recurring of recurringTransactions.filter((r) => r.isActive)) {
      const startDate = new Date(recurring.startDate);
      const endDate = recurring.endDate ? new Date(recurring.endDate) : null;

      // Skip if recurring hasn't started yet or has ended
      if (startDate > lastDay || (endDate && endDate < firstDay)) {
        continue;
      }

      // Calculate expected date for this month
      let expectedDate: Date;

      switch (recurring.frequency) {
        case "monthly":
          expectedDate = new Date(year, month, startDate.getDate());
          break;
        case "weekly":
          // Find the first occurrence in the month
          expectedDate = new Date(startDate);
          while (expectedDate < firstDay) {
            expectedDate.setDate(expectedDate.getDate() + 7);
          }
          break;
        case "yearly":
          if (startDate.getMonth() === month) {
            expectedDate = new Date(year, month, startDate.getDate());
          } else {
            continue;
          }
          break;
        default:
          continue;
      }

      // Check if expected date is within the current month
      if (expectedDate >= firstDay && expectedDate <= lastDay) {
        // Check if this instance has been completed
        const linkedTransaction = transactions.find(
          (t) =>
            t.payeeId === recurring.payeeId &&
            Math.abs(new Date(t.date).getTime() - expectedDate.getTime()) <
              7 * 24 * 60 * 60 * 1000, // Within 7 days
        );

        instances.push({
          id: `${recurring.id}-${expectedDate.toISOString()}`,
          recurringTransactionId: recurring.id,
          expectedDate: expectedDate.toISOString(),
          status: linkedTransaction ? "completed" : "pending",
          linkedTransactionId: linkedTransaction?.id,
          recurringTransaction: recurring,
          linkedTransaction,
        });
      }
    }

    return instances.sort(
      (a, b) =>
        new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime(),
    );
  };

  const monthlyInstances = generateMonthlyInstances();
  const pendingInstances = monthlyInstances.filter(
    (i) => i.status === "pending",
  );
  const completedInstances = monthlyInstances.filter(
    (i) => i.status === "completed",
  );

  // Group instances by category
  const groupedInstances = monthlyInstances.reduce(
    (acc, instance) => {
      const categoryId = instance.recurringTransaction.categoryId;
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || "Sin categoría";

      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(instance);
      return acc;
    },
    {} as Record<string, typeof monthlyInstances>,
  );

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number.parseFloat(amount));
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  };

  const getPayeeName = (payeeId: number | null) => {
    if (!payeeId) return "Sin comerciante";
    const payee = payees.find((p) => p.id === payeeId);
    return payee?.name || "Comerciante desconocido";
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: "Diario",
      weekly: "Semanal",
      monthly: "Mensual",
      yearly: "Anual",
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const totalExpected = monthlyInstances.reduce(
    (sum, instance) =>
      sum + Number.parseFloat(instance.recurringTransaction.amount),
    0,
  );

  const totalPaid = completedInstances.reduce(
    (sum, instance) =>
      sum + Number.parseFloat(instance.recurringTransaction.amount),
    0,
  );

  const amountRemaining = totalExpected - totalPaid;

  return (
    <DashboardLayout title="Transacciones Recurrentes">
      <div className="space-y-6">
        {/* Header with Month Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-bold text-2xl capitalize">
              {formatMonth(currentDate)}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cargo Recurrente
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beneficiario</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Ocurrencia</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-12">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedInstances).map(
                      ([categoryName, instances]) => (
                        <>
                          <TableRow
                            key={`category-${categoryName}`}
                            className="bg-muted/50"
                          >
                            <TableCell colSpan={6} className="font-medium">
                              Categoria: {categoryName}
                            </TableCell>
                          </TableRow>
                          {instances.map((instance) => (
                            <TableRow key={instance.id}>
                              <TableCell className="font-medium">
                                {getPayeeName(
                                  instance.recurringTransaction.payeeId,
                                )}
                              </TableCell>
                              <TableCell>
                                {instance.recurringTransaction.description}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getFrequencyLabel(
                                    instance.recurringTransaction.frequency,
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatDate(instance.expectedDate)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(
                                  instance.recurringTransaction.amount,
                                )}
                              </TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          ))}
                        </>
                      ),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-medium text-sm">
                  REVIEW RECURRING ITEMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Jump to Month
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-medium text-sm uppercase">
                  {formatMonth(currentDate)} Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="font-medium text-sm">RECURRING EXPENSES</div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Expected
                    </span>
                    <span className="font-medium text-sm">
                      {formatCurrency(totalExpected.toString())}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Paid</span>
                    <span className="font-medium text-sm">
                      {formatCurrency(totalPaid.toString())}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-sm">
                      Amount remaining
                    </span>
                    <span className="font-medium text-sm">
                      {formatCurrency(amountRemaining.toString())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <RecurrentSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          payees={payees}
          categories={categories}
          accounts={accounts}
        />
      </div>
    </DashboardLayout>
  );
}
