import type { UseMutationResult } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon2, ChevronRight, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { Input } from "@/components/ui/input";
import { PayeeCombobox } from "@/components/ui/payee-combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Account } from "@/features/dashboard/api/accounts";
import type { Category } from "@/features/dashboard/api/categories";
import type { Payee } from "@/features/dashboard/api/payees";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";
import {
  transactionTypeColors,
  transactionTypeLabels,
} from "@/features/dashboard/api/transactions";

function EditableDateCell({
  transaction,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(transaction.date));

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setOpen(false);
    updateTransactionMutation.mutateAsync({
      ...transaction,
      date: date.toISOString(),
      notes: transaction.notes ?? undefined,
      userAccountId: transaction.userAccountId ?? "",
      categoryId: transaction.categoryId ?? undefined,
      payeeId: transaction.payeeId ?? undefined,
      transferAccountId: transaction.transferAccountId ?? undefined,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            "flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-sm transition-colors hover:border-primary hover:bg-accent hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary "
          }
          onClick={() => setOpen(true)}
        >
          <CalendarIcon2 className="h-3 w-3" />
          <span>{format(selectedDate, "yyyy-MM-dd")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange}
        />
      </PopoverContent>
    </Popover>
  );
}

function InlineAmountInput({
  transaction,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) {
  const [amountInput, setAmountInput] = useState(transaction.amount);
  const [originalAmount, setOriginalAmount] = useState(transaction.amount);

  const handleBlur = async () => {
    if (amountInput !== originalAmount) {
      await updateTransactionMutation.mutateAsync({
        ...transaction,
        amount: amountInput,
        notes: transaction.notes ?? undefined,
        userAccountId: transaction.userAccountId ?? "",
        categoryId: transaction.categoryId ?? undefined,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
      setOriginalAmount(amountInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setAmountInput(originalAmount);
    }
  };

  return (
    <Input
      value={amountInput}
      onChange={(e) => setAmountInput(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-full text-right"
    />
  );
}

export function TransactionTable({
  transactions,
  accounts,
  categories,
  payees,
  updateTransactionMutation,
  createPayee,
  createCategory,
  handleEditTransaction,
  getTransactionIcon,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  payees: Payee[];
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
  createPayee: (name: string) => Promise<number | undefined>;
  createCategory: (name: string) => Promise<number | undefined>;
  handleEditTransaction: (transaction: Transaction) => void;
  getTransactionIcon: (type: Transaction["type"]) => React.ReactNode;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20 min-w-[64px] text-center">Fecha</TableHead>
          <TableHead className="w-48 min-w-[180px]">Beneficiario</TableHead>
          <TableHead className="w-32 min-w-[120px]">Categoría</TableHead>
          <TableHead className="w-64 min-w-[240px]">Descripción</TableHead>
          <TableHead className="w-16 min-w-[60px] text-center">Tipo</TableHead>
          <TableHead className="w-20 min-w-[64px] text-center">Monto</TableHead>
          <TableHead className="w-32 min-w-[120px] text-center">
            Cuenta
          </TableHead>
          <TableHead className="w-20 min-w-[64px] text-right">
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="w-20 min-w-[64px] text-center">
              <EditableDateCell
                transaction={transaction}
                updateTransactionMutation={updateTransactionMutation}
              />
            </TableCell>
            <TableCell className="w-48 min-w-[180px]">
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
                onCreatePayee={createPayee}
                placeholder="Selecciona o crea un beneficiario"
              />
            </TableCell>
            <TableCell className="w-32 min-w-[120px]">
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
                onCreateCategory={createCategory}
                placeholder="Sin categoría"
              />
            </TableCell>
            <TableCell className="w-64 min-w-[240px] font-medium">
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
                        userAccountId: transaction.userAccountId ?? "",
                        categoryId: transaction.categoryId ?? undefined,
                        payeeId: transaction.payeeId ?? undefined,
                        transferAccountId:
                          transaction.transferAccountId ?? undefined,
                      });
                    }
                  }}
                  onBlur={async (e) => {
                    const newDescription = e.target.value;
                    if (!newDescription.trim()) {
                      e.target.value = transaction.description;
                    }
                  }}
                  className="font-medium"
                  placeholder="Descripción"
                />
              </div>
            </TableCell>
            <TableCell className="w-16 min-w-[60px] text-center">
              <Badge className={transactionTypeColors[transaction.type]}>
                {transactionTypeLabels[transaction.type]}
              </Badge>
            </TableCell>
            <TableCell className="w-20 min-w-[64px] text-center font-mono">
              <InlineAmountInput
                transaction={transaction}
                updateTransactionMutation={updateTransactionMutation}
              />
            </TableCell>
            <TableCell className="w-32 min-w-[120px] text-center">
              <div className="flex items-center justify-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <Select
                  value={transaction.userAccountId ?? ""}
                  onValueChange={async (value) => {
                    await updateTransactionMutation.mutateAsync({
                      ...transaction,
                      userAccountId: value,
                      notes: transaction.notes ?? undefined,
                      categoryId: transaction.categoryId ?? undefined,
                      payeeId: transaction.payeeId ?? undefined,
                      transferAccountId:
                        transaction.transferAccountId ?? undefined,
                    });
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Cuenta" />
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
            </TableCell>
            <TableCell className="w-20 min-w-[64px] text-right">
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
  );
}
