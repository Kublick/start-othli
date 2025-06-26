import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Calendar as CalendarIcon2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PayeeCombobox } from "@/components/ui/payee-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useActiveAccounts } from "@/features/dashboard/api/accounts";
import {
  type Category,
  useActiveCategories,
  useCreateCategories,
} from "@/features/dashboard/api/categories";
import { useCreatePayee, usePayees } from "@/features/dashboard/api/payees";
import {
  formatDate,
  type Transaction,
  type TransactionFilters,
  type TransactionFormData,
  transactionTypeColors,
  transactionTypeLabels,
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/features/dashboard/api/transactions";

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
  const [showFilters, setShowFilters] = useState(false);
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

  // Get current month from URL or default to current month
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
  const pagination = data?.pagination;
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
      currency: "USD",
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

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return "Sin cuenta";
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.name || "Sin cuenta";
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "income":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "expense":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case "transfer":
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>
                  Filtra las transacciones por diferentes criterios
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? "Ocultar" : "Mostrar"} Filtros
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar transacciones..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="income">Ingresos</SelectItem>
                      <SelectItem value="expense">Gastos</SelectItem>
                      <SelectItem value="transfer">Transferencias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Cuenta</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las cuentas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las cuentas</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((category: Category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beneficiario</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Monto</TableHead>
                    <TableHead className="text-center">Cuenta</TableHead>
                    <TableHead className="text-center">Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <PayeeCombobox
                          value={transaction.payeeId ?? undefined}
                          payees={payees}
                          onChange={async (payeeId) => {
                            await updateTransactionMutation.mutateAsync({
                              ...transaction,
                              payeeId,
                              notes: transaction.notes ?? undefined,
                              userAccountId: transaction.userAccountId ?? "",
                              categoryId: transaction.categoryId ?? undefined,
                              transferAccountId:
                                transaction.transferAccountId ?? undefined,
                            });
                          }}
                          onCreatePayee={async (name) => {
                            await createPayee(name);
                          }}
                          placeholder="Selecciona o crea un beneficiario"
                        />
                      </TableCell>
                      <TableCell>
                        <CategoryCombobox
                          value={transaction.categoryId ?? undefined}
                          categories={categories}
                          onChange={async (categoryId) => {
                            await updateTransactionMutation.mutateAsync({
                              ...transaction,
                              categoryId,
                              notes: transaction.notes ?? undefined,
                              userAccountId: transaction.userAccountId ?? "",
                              payeeId: transaction.payeeId ?? undefined,
                              transferAccountId:
                                transaction.transferAccountId ?? undefined,
                            });
                          }}
                          onCreateCategory={async (name) => {
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
                          placeholder="Sin categoría"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          <Input
                            value={transaction.description}
                            onChange={async (e) => {
                              const newDescription = e.target.value;
                              if (newDescription.trim()) {
                                await updateTransactionMutation.mutateAsync({
                                  ...transaction,
                                  description: newDescription,
                                  notes: transaction.notes ?? undefined,
                                  userAccountId:
                                    transaction.userAccountId ?? "",
                                  categoryId:
                                    transaction.categoryId ?? undefined,
                                  payeeId: transaction.payeeId ?? undefined,
                                  transferAccountId:
                                    transaction.transferAccountId ?? undefined,
                                });
                              }
                            }}
                            onBlur={async (e) => {
                              const newDescription = e.target.value;
                              if (!newDescription.trim()) {
                                // Revert to original value if invalid
                                e.target.value = transaction.description;
                              }
                            }}
                            className="font-medium"
                            placeholder="Descripción"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={transactionTypeColors[transaction.type]}
                        >
                          {transactionTypeLabels[transaction.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <Input
                          type="number"
                          step="0.01"
                          value={transaction.amount}
                          onChange={async (e) => {
                            const newAmount = e.target.value;
                            // Allow negative values but ensure it's a valid number
                            if (
                              newAmount !== "" &&
                              !Number.isNaN(Number.parseFloat(newAmount))
                            ) {
                              await updateTransactionMutation.mutateAsync({
                                ...transaction,
                                amount: newAmount,
                                notes: transaction.notes ?? undefined,
                                userAccountId: transaction.userAccountId ?? "",
                                categoryId: transaction.categoryId ?? undefined,
                                payeeId: transaction.payeeId ?? undefined,
                                transferAccountId:
                                  transaction.transferAccountId ?? undefined,
                              });
                            }
                          }}
                          onBlur={async (e) => {
                            const newAmount = e.target.value;
                            if (
                              newAmount === "" ||
                              Number.isNaN(Number.parseFloat(newAmount))
                            ) {
                              // Revert to original value if invalid
                              e.target.value = transaction.amount;
                            }
                          }}
                          className={`w-full text-right font-mono ${
                            Number.parseFloat(transaction.amount) < 0
                              ? "text-red-600"
                              : ""
                          }`}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">
                            {getAccountName(transaction.userAccountId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CalendarIcon2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            aria-label="Ver detalles"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Transaction Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>
                {editingTransaction
                  ? "Editar Transacción"
                  : "Nueva Transacción"}
              </SheetTitle>
              <SheetDescription>
                {editingTransaction
                  ? "Modifica los detalles de la transacción"
                  : "Crea una nueva transacción"}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 py-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="payee">Beneficiario *</Label>
                <PayeeCombobox
                  value={formData.payeeId ?? undefined}
                  payees={payees}
                  onChange={(payeeId) => setFormData({ ...formData, payeeId })}
                  onCreatePayee={async (name) => {
                    await createPayee(name);
                  }}
                  placeholder="Selecciona o crea un beneficiario"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Categoría</Label>
                <CategoryCombobox
                  value={formData.categoryId ?? undefined}
                  categories={categories}
                  onChange={(categoryId) =>
                    setFormData({ ...formData, categoryId })
                  }
                  onCreateCategory={async (name) => {
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
                  placeholder="Sin categoría"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ej: Compra en supermercado, Pago de salario"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="b flex flex-col gap-2 ">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "income" | "expense" | "transfer") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="account">Cuenta *</Label>
                <Select
                  value={formData.userAccountId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, userAccountId: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notas adicionales sobre la transacción"
                  rows={3}
                />
              </div>
            </div>
            <SheetFooter>
              <Button onClick={handleSaveTransaction}>
                {editingTransaction ? "Actualizar" : "Crear"} Transacción
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
