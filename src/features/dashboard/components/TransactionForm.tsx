import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MyCombobox } from "@/components/ui/my-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Account } from "@/features/dashboard/api/accounts";
import type { Category } from "@/features/dashboard/api/categories";
import type { Payee } from "@/features/dashboard/api/payees";
// import type { RecurringTransaction } from "@/features/dashboard/api/recurringTransactions";
import type { TransactionFormData } from "@/features/dashboard/api/transactions";

const transactionSchema = z.object({
  payeeId: z.number().optional(),
  categoryId: z.number().optional(),
  description: z.string().optional(),
  amount: z.string().min(1, "El monto es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  userAccountId: z.string().min(1, "La cuenta es requerida"),
  notes: z.string().optional(),
});

type TransactionFormSchema = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  formData: TransactionFormData;
  accounts: Account[];
  categories: Category[];
  payees: Payee[];
  createPayee: (name: string) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  saveLoading: boolean;
  editingTransactionId?: string;
  onUpdateTransaction: (data: { id: string } & TransactionFormData) => void;
  onCreateTransaction: (data: TransactionFormData) => void;
  onOpenChange: (open: boolean) => void;
}

export function TransactionForm({
  formData,
  accounts,
  categories,
  payees,
  createPayee,
  createCategory,
  saveLoading,
  editingTransactionId,
  onUpdateTransaction,
  onCreateTransaction,
  onOpenChange,
}: TransactionFormProps) {
  // Determine initial sign from formData.amount
  const initialIsNegative = React.useMemo(() => {
    if (formData.amount === undefined || formData.amount === "") return true;
    return Number(formData.amount) < 0;
  }, [formData.amount]);
  const [isNegative, setIsNegative] = React.useState(initialIsNegative);

  const form = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      payeeId: formData.payeeId,
      categoryId: formData.categoryId,
      description: formData.description || "",
      amount: formData.amount ? String(Math.abs(Number(formData.amount))) : "",
      date: formData.date,
      userAccountId: formData.userAccountId,
      notes: formData.notes || "",
    },
  });

  // Keep react-hook-form in sync with parent state
  useEffect(() => {
    form.reset({
      ...formData,
      amount: formData.amount ? String(Math.abs(Number(formData.amount))) : "",
      description: formData.description || "",
      notes: formData.notes || "",
    });
    setIsNegative(
      formData.amount === undefined || formData.amount === ""
        ? true
        : Number(formData.amount) < 0,
    );
  }, [formData, form]);

  // When category changes, adjust isNegative based on category type
  React.useEffect(() => {
    const categoryId = form.watch("categoryId");
    if (!categoryId) return;
    const selectedCategory = categories.find((c) => c.id === categoryId);
    if (!selectedCategory) return;
    setIsNegative(!selectedCategory.isIncome);
  }, [categories, form.watch]);

  const [submitted, setSubmitted] = React.useState(false);
  const handleSubmit = (values: TransactionFormSchema) => {
    // Combine sign and value
    const absAmount = Math.abs(Number(values.amount));
    const signedAmount = isNegative ? -absAmount : absAmount;
    const fullValues = {
      ...values,
      amount: String(signedAmount),
      currency: formData.currency,
      description: values.description || undefined, // Convert empty string to undefined
    };
    setSubmitted(true);
    if (editingTransactionId) {
      onUpdateTransaction({ id: editingTransactionId, ...fullValues });
    } else {
      onCreateTransaction(fullValues);
    }
  };

  // Effect to close the sheet after a successful mutation
  React.useEffect(() => {
    if (submitted && !saveLoading) {
      onOpenChange(false);
      setSubmitted(false);
    }
  }, [submitted, saveLoading, onOpenChange]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="payeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beneficiario *</FormLabel>
              <FormControl>
                <MyCombobox
                  options={payees.map((p) => ({
                    value: p.id.toString(),
                    label: p.name,
                  }))}
                  value={field.value ? String(field.value) : ""}
                  onChange={async (val) => {
                    const payeeId = Number(val);
                    if (!payees.some((p) => p.id === payeeId)) {
                      await createPayee(val);
                    }
                    field.onChange(payeeId);
                  }}
                  allowCreate
                  placeholder="Selecciona o crea un beneficiario"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <FormControl>
                <MyCombobox
                  options={categories.map((c) => ({
                    value: c.id.toString(),
                    label: c.name,
                  }))}
                  value={field.value ? String(field.value) : ""}
                  onChange={async (val) => {
                    const categoryId = Number(val);
                    if (!categories.some((c) => c.id === categoryId)) {
                      await createCategory(val);
                    }
                    field.onChange(categoryId);
                  }}
                  allowCreate
                  placeholder="Sin categoría"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej: Compra en supermercado, Pago de salario"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto *</FormLabel>
              <FormControl>
                <div className="relative w-full">
                  <button
                    type="button"
                    aria-label={
                      isNegative ? "Cambiar a positivo" : "Cambiar a negativo"
                    }
                    className={[
                      "-translate-y-1/2 absolute top-1/2 left-1 z-10 flex h-6 w-6 items-center justify-center rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400",
                      isNegative ? "bg-red-600" : "bg-green-600",
                    ].join(" ")}
                    tabIndex={0}
                    onClick={() => setIsNegative((prev) => !prev)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setIsNegative((prev) => !prev);
                      }
                    }}
                  >
                    {isNegative ? "-" : "+"}
                  </button>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pr-2 pl-8"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha *</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta *</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Notas adicionales sobre la transacción"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" className="w-full" disabled={saveLoading}>
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}

// // Add this function to automatically link transactions with recurring items
// const findMatchingRecurringTransaction = (
//   payeeId: number | undefined,
//   payees: Payee[],
//   recurringTransactions: RecurringTransaction[],
// ): string | undefined => {
//   if (!payeeId) return undefined;

//   const payee = payees.find((p) => p.id === payeeId);
//   if (!payee) return undefined;

//   // Find recurring transaction with matching payee
//   const matchingRecurring = recurringTransactions.find(
//     (rt) => rt.payeeId === payeeId && rt.isActive,
//   );

//   return matchingRecurring?.id;
// };

// // Update the onSubmit function to include recurringTransactionId
// const onSubmit = (data: TransactionFormSchema) => {
//   const recurringTransactionId = findMatchingRecurringTransaction(
//     data.payeeId,
//     payees,
//     recurringTransactions || [],
//   );

//   const submitData: TransactionFormData = {
//     ...data,
//     currency: "MXN",
//     recurringTransactionId, // Add this field
//   };
// };
