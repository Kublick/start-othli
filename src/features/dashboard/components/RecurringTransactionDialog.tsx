import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Account } from "@/features/dashboard/api/accounts";
import type { Category } from "@/features/dashboard/api/categories";
import type { Payee } from "@/features/dashboard/api/payees";
import type {
  RecurringTransaction,
  RecurringTransactionFormData,
} from "@/features/dashboard/api/recurringTransactions";
import { RecurringTransactionForm } from "./RecurringTransactionForm";

interface RecurringTransactionDialogProps {
  accounts: Account[];
  categories: Category[];
  payees: Payee[];
  createPayee: (name: string) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  saveLoading: boolean;
  onCreateRecurringTransaction: (data: RecurringTransactionFormData) => void;
  onUpdateRecurringTransaction: (
    data: { id: string } & RecurringTransactionFormData,
  ) => void;
  editingRecurringTransaction?: RecurringTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecurringTransactionDialog({
  accounts,
  categories,
  payees,
  createPayee,
  createCategory,
  saveLoading,
  onCreateRecurringTransaction,
  onUpdateRecurringTransaction,
  editingRecurringTransaction,
  open,
  onOpenChange,
}: RecurringTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Recurring Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingRecurringTransaction ? "Edit" : "Create"} Recurring Item
          </DialogTitle>
          <DialogDescription>
            A recurring item is a transaction you expect to occur on a regular
            basis. This can be an expense or income.
          </DialogDescription>
        </DialogHeader>
        <RecurringTransactionForm
          formData={editingRecurringTransaction}
          accounts={accounts}
          categories={categories}
          payees={payees}
          createPayee={createPayee}
          createCategory={createCategory}
          saveLoading={saveLoading}
          editingRecurringTransactionId={editingRecurringTransaction?.id}
          onUpdateRecurringTransaction={onUpdateRecurringTransaction}
          onCreateRecurringTransaction={onCreateRecurringTransaction}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
