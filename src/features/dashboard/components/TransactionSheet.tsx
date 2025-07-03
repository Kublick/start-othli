import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter as DialogFooterUI,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import type { Account } from "@/features/dashboard/api/accounts";
import type { Category } from "@/features/dashboard/api/categories";
import type { Payee } from "@/features/dashboard/api/payees";
import type {
  Transaction,
  TransactionFormData,
} from "@/features/dashboard/api/transactions";

interface TransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: TransactionFormData;
  setFormData: (data: TransactionFormData) => void;
  editingTransaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  payees: Payee[];
  createPayee: (name: string) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  onSave: () => void;
  onDelete: () => void;
  deleteStatus: "idle" | "pending" | "success" | "error";
  saveLoading: boolean;
}

export function TransactionSheet({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingTransaction,
  accounts,
  categories,
  payees,
  createPayee,
  createCategory,
  onSave,
  onDelete,
  deleteStatus,
  saveLoading,
}: TransactionSheetProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>
            {editingTransaction ? "Editar Transacción" : "Nueva Transacción"}
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
              onCreatePayee={createPayee}
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
              onCreateCategory={createCategory}
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
          <div className="flex w-full flex-col gap-2 ">
            {editingTransaction && (
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <Button
                  variant="destructive"
                  type="button"
                  className="w-full"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Borrar Transacción
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>¿Borrar transacción?</DialogTitle>
                    <DialogDescription>
                      Esta acción no se puede deshacer. ¿Estás seguro de que
                      deseas borrar esta transacción?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooterUI className="flex w-full gap-2">
                    <DialogClose asChild>
                      <Button className="w-1/2" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button
                      className="w-1/2"
                      variant="destructive"
                      onClick={onDelete}
                      disabled={deleteStatus === "pending"}
                    >
                      {deleteStatus === "pending" ? "Borrando..." : "Borrar"}
                    </Button>
                  </DialogFooterUI>
                </DialogContent>
              </Dialog>
            )}
            <Button className="w-full" onClick={onSave} disabled={saveLoading}>
              {editingTransaction ? "Actualizar" : "Crear"} Transacción
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
