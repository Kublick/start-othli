import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Calendar as CalendarIcon2,
  ChevronRight,
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
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
  formatAmount,
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
});

function RouteComponent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
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

  const { mutateAsync: createCategory } = useCreateCategories();
  const { data: payees = [] } = usePayees();
  const { mutateAsync: createPayee } = useCreatePayee();

  // React Query hooks
  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: accounts = [] } = useActiveAccounts();
  const { data: categories = [] } = useActiveCategories();
  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

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

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
      try {
        await deleteTransactionMutation.mutateAsync({ id: transaction.id });
      } catch (error) {
        console.error("Error deleting transaction:", error);
        // Error handling is done in the mutation
      }
    }
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return "Sin cuenta";
    const account = accounts.find((acc: any) => acc.id === accountId);
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
                      value={filters.search || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={filters.type || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        type:
                          value === "all"
                            ? undefined
                            : (value as "income" | "expense" | "transfer"),
                      })
                    }
                  >
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
                  <Select
                    value={filters.accountId || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        accountId: value === "all" ? undefined : value,
                      })
                    }
                  >
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
                  <Select
                    value={filters.categoryId?.toString() || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        categoryId:
                          value === "all"
                            ? undefined
                            : Number.parseInt(value, 10),
                      })
                    }
                  >
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

              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setFilters({})}>
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Transacciones</CardTitle>
            <CardDescription>
              {transactions.length} transacción
              {transactions.length !== 1 ? "es" : ""} encontrada
              {transactions.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">
                  No hay transacciones para mostrar
                </p>
                <Button onClick={handleCreateTransaction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Transacción
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
                          className="w-full text-right font-mono"
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
            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTransaction}>
                {editingTransaction ? "Actualizar" : "Crear"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
