import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter as DialogFooterUI,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Account } from "@/features/dashboard/api/accounts";
import type { Category } from "@/features/dashboard/api/categories";
import type { Payee } from "@/features/dashboard/api/payees";
import type {
  Transaction,
  TransactionFormData,
} from "@/features/dashboard/api/transactions";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/features/dashboard/api/transactions";
import { TransactionForm } from "./TransactionForm";
import { TransactionHistory } from "./TransactionHistory";

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
  editingTransaction,
  accounts,
  categories,
  payees,
  createPayee,
  createCategory,
  onDelete,
  deleteStatus,
  saveLoading,
}: TransactionSheetProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const updateTransactionMutation = useUpdateTransaction();
  const createTransactionMutation = useCreateTransaction();

  useEffect(() => {
    if (!open) setActiveTab("details");
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-screen max-h-screen w-[400px] flex-col sm:w-[540px]">
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

        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 w-full flex-1 flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            {editingTransaction && (
              <TabsTrigger value="history">Historial</TabsTrigger>
            )}
          </TabsList>

          <TabsContent
            value="details"
            className="flex flex-col gap-4 px-4 py-6"
          >
            <TransactionForm
              onOpenChange={onOpenChange}
              formData={formData}
              accounts={accounts}
              categories={categories}
              payees={payees}
              createPayee={createPayee}
              createCategory={createCategory}
              saveLoading={saveLoading}
              editingTransactionId={editingTransaction?.id}
              onUpdateTransaction={(data) =>
                updateTransactionMutation.mutate(data)
              }
              onCreateTransaction={(data) =>
                createTransactionMutation.mutate({ transaction: data })
              }
            />
          </TabsContent>

          {editingTransaction && (
            <TabsContent
              value="history"
              className="flex min-h-0 flex-1 flex-col px-4 py-6"
            >
              <TransactionHistory
                transactionId={editingTransaction.id}
                transactionDescription={editingTransaction.description}
                accounts={accounts}
                categories={categories}
                payees={payees}
              />
            </TabsContent>
          )}
        </Tabs>

        {activeTab === "details" && editingTransaction && (
          <SheetFooter>
            <div className="flex w-full flex-col gap-2 ">
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
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
