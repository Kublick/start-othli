import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronRight,
  DollarSign,
  Edit,
  Lock,
  Plus,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import {
  type Account,
  type AccountFormData,
  accountTypeColors,
  accountTypeLabels,
  useActiveAccounts,
  useCloseAccount,
  useClosedAccounts,
  useCreateAccounts,
  useDeleteAccount,
  useUpdateAccount,
} from "@/features/dashboard/api/accounts";

interface SortableTableRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onInlineEditStart: (account: Account) => void;
  inlineEditingId: string | null;
  inlineEditValue: string;
  setInlineEditValue: (value: string) => void;
  handleInlineEditSave: () => void;
  handleInlineEditCancel: () => void;
  handleInlineEditKeyDown: (e: React.KeyboardEvent) => void;
  isInlineSaving: boolean;
  inlineInputRef: React.RefObject<HTMLInputElement | null>;
}

// Sortable table row component
function SortableTableRow({
  account,
  onEdit,
  onInlineEditStart,
  inlineEditingId,
  inlineEditValue,
  setInlineEditValue,
  handleInlineEditSave,
  handleInlineEditCancel,
  handleInlineEditKeyDown,
  isInlineSaving,
  inlineInputRef,
}: SortableTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {inlineEditingId === account.id ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inlineInputRef}
              value={inlineEditValue}
              onChange={(e) => setInlineEditValue(e.target.value)}
              onKeyDown={handleInlineEditKeyDown}
              onBlur={handleInlineEditSave}
              className="h-8 text-sm"
              disabled={isInlineSaving}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInlineEditSave}
              disabled={isInlineSaving}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInlineEditCancel}
              disabled={isInlineSaving}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="-mx-2 w-full cursor-pointer rounded px-2 py-1 text-left font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onInlineEditStart(account)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onInlineEditStart(account);
              }
            }}
            title="Haz clic para editar"
          >
            {account.name}
          </button>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge className={accountTypeColors[account.type]}>
          {accountTypeLabels[account.type]}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">
            {Number.parseFloat(account.balance).toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-muted-foreground text-xs">
            {account.currency}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {account.institutionName ? (
          <div className="flex items-center justify-center gap-1">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              {account.institutionName}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Sin institución</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onEdit(account)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export const Route = createFileRoute("/config/cuentas")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const inlineInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    type: "debito",
    balance: "0.00",
    currency: "MXN",
    institutionName: "",
    excludeTransactions: false,
  });

  // React Query hooks
  const { data: activeAccounts = [], isLoading: isLoadingActive } =
    useActiveAccounts();
  const { data: closedAccounts = [] } = useClosedAccounts();
  const createAccountsMutation = useCreateAccounts();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();
  const closeAccountMutation = useCloseAccount();

  // Focus the inline input when editing starts
  useEffect(() => {
    if (inlineEditingId && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineEditingId]);

  const handleInlineEditStart = (account: Account) => {
    setInlineEditingId(account.id);
    setInlineEditValue(account.name);
  };

  const handleInlineEditSave = async () => {
    if (!inlineEditingId || !inlineEditValue.trim()) {
      setInlineEditingId(null);
      return;
    }

    const originalAccount = activeAccounts.find(
      (acc: Account) => acc.id === inlineEditingId,
    );
    if (!originalAccount || originalAccount.name === inlineEditValue.trim()) {
      setInlineEditingId(null);
      return;
    }

    try {
      await updateAccountMutation.mutateAsync({
        id: inlineEditingId,
        name: inlineEditValue.trim(),
        type: originalAccount.type,
        balance: originalAccount.balance,
        currency: originalAccount.currency,
        institutionName: originalAccount.institutionName || "",
        excludeTransactions: originalAccount.excludeTransactions,
      });
      setInlineEditingId(null);
    } catch (error) {
      console.error("Error updating account:", error);
      // Error handling is done in the mutation
    }
  };

  const handleInlineEditCancel = () => {
    setInlineEditingId(null);
    setInlineEditValue("");
  };

  const handleInlineEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInlineEditSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleInlineEditCancel();
    }
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      type: "debito",
      balance: "0.00",
      currency: "MXN",
      institutionName: "",
      excludeTransactions: false,
    });
    setIsSheetOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      institutionName: account.institutionName || "",
      excludeTransactions: account.excludeTransactions,
    });
    setIsSheetOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre de la cuenta es requerido");
      return;
    }

    try {
      if (editingAccount) {
        // Update existing account
        await updateAccountMutation.mutateAsync({
          id: editingAccount.id,
          ...formData,
        });
      } else {
        // Create new account
        await createAccountsMutation.mutateAsync({
          accounts: [formData],
        });
      }

      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error saving account:", error);
      // Error handling is done in the mutation
    }
  };

  const handleDeleteAccount = async () => {
    if (!editingAccount) return;

    try {
      await deleteAccountMutation.mutateAsync({ id: editingAccount.id });
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      // Error handling is done in the mutation
    }
  };

  const handleCloseAccount = async (close: boolean) => {
    if (!editingAccount) return;

    try {
      await closeAccountMutation.mutateAsync({
        id: editingAccount.id,
        closedOn: close ? new Date().toISOString() : null,
      });
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error updating account:", error);
      // Error handling is done in the mutation
    }
  };

  if (isLoadingActive) {
    return (
      <DashboardLayout title="Cuentas">
        <div className="space-y-4">
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cuentas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl">Gestión de Cuentas</h2>
            <p className="text-muted-foreground">
              Administra tus cuentas financieras y bancarias
            </p>
          </div>
          <Button onClick={handleCreateAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cuenta
          </Button>
        </div>

        {/* Active Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Cuentas Activas</CardTitle>
            <CardDescription>
              Cuentas que puedes usar para tus transacciones y presupuestos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeAccounts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">
                  No tienes cuentas configuradas
                </p>
                <Button onClick={handleCreateAccount}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Cuenta
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Saldo</TableHead>
                    <TableHead className="text-center">Institución</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAccounts.map((account) => (
                    <SortableTableRow
                      key={account.id}
                      account={account}
                      onEdit={handleEditAccount}
                      onInlineEditStart={handleInlineEditStart}
                      inlineEditingId={inlineEditingId}
                      inlineEditValue={inlineEditValue}
                      setInlineEditValue={setInlineEditValue}
                      handleInlineEditSave={handleInlineEditSave}
                      handleInlineEditCancel={handleInlineEditCancel}
                      handleInlineEditKeyDown={handleInlineEditKeyDown}
                      isInlineSaving={updateAccountMutation.isPending}
                      inlineInputRef={inlineInputRef}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Closed Accounts */}
        {closedAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cuentas Cerradas</CardTitle>
              <CardDescription>
                Cuentas que han sido cerradas y no se usan activamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Saldo</TableHead>
                    <TableHead className="text-center">Cerrada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {account.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={accountTypeColors[account.type]}>
                          {accountTypeLabels[account.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-muted-foreground">
                            {Number.parseFloat(account.balance).toLocaleString(
                              "es-ES",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {account.currency}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {account.closedOn
                          ? new Date(account.closedOn).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Account Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>
                {editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}
              </SheetTitle>
              <SheetDescription>
                {editingAccount
                  ? "Modifica los detalles de la cuenta"
                  : "Crea una nueva cuenta financiera"}
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-6 px-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Cuenta Principal, Tarjeta de Crédito"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de Cuenta *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Account["type"]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="inversion">Inversión</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="balance">Saldo</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="COP">COP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="institutionName">Institución Financiera</Label>
                <Input
                  id="institutionName"
                  value={formData.institutionName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      institutionName: e.target.value,
                    })
                  }
                  placeholder="Ej: Banco Nacional, PayPal"
                />
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="excludeTransactions"
                    checked={formData.excludeTransactions}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        excludeTransactions: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="excludeTransactions">
                    Excluir de transacciones
                  </Label>
                </div>
              </div>

              {/* Danger Zone for editing existing accounts */}
              {editingAccount && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <h4 className="font-medium">Zona de Peligro</h4>
                    </div>
                    <div className="space-y-3">
                      {editingAccount.closedOn ? (
                        <Button
                          variant="outline"
                          onClick={() => handleCloseAccount(false)}
                          className="w-full justify-start"
                        >
                          <Unlock className="mr-2 h-4 w-4" />
                          Reabrir Cuenta
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleCloseAccount(true)}
                          className="w-full justify-start"
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          Cerrar Cuenta
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        className="w-full justify-start"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Cuenta
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAccount}>
                {editingAccount ? "Actualizar" : "Crear"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
