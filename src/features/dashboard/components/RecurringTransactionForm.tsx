import { zodResolver } from "@hookform/resolvers/zod";

import { useEffect } from "react";
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
import type { Account } from "@/features/dashboard/api/accounts";
import type { Category } from "@/features/dashboard/api/categories";
import type { Payee } from "@/features/dashboard/api/payees";
import {
  type RecurringTransaction,
  type RecurringTransactionFormData,
  useCreateRecurringTransaction,
} from "@/features/dashboard/api/recurringTransactions";

const recurringTransactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  frequency: z.enum([
    "daily",
    "weekly",
    "biweekly",
    "monthly",
    "quarterly",
    "semester",
    "yearly",
  ]),
  billingDate: z.string().min(1, "Fecha de facturación es requerida"),
  startDate: z.string().min(1, "Fecha de inicio es requerida"),
  endDate: z.string().optional(),
  userAccountId: z.string().min(1, "La cuenta es requerida"),
  categoryId: z.number().min(1, "La categoría es requerida"),
  payeeId: z.number().min(1, "El beneficiario es requerido"),
});

type RecurringTransactionFormSchema = z.infer<
  typeof recurringTransactionSchema
>;

interface RecurringTransactionFormProps {
  formData?: RecurringTransaction;
  accounts: Account[];
  categories: Category[];
  payees: Payee[];
  createPayee: (name: string) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  saveLoading: boolean;
  editingRecurringTransactionId?: string;
  onUpdateRecurringTransaction: (
    data: { id: string } & RecurringTransactionFormData,
  ) => void;
  onOpenChange: (open: boolean) => void;
}

export function RecurringTransactionForm({
  // formData,
  accounts,
  categories,
  payees,
  saveLoading,
  editingRecurringTransactionId,
  // onUpdateRecurringTransaction,
  onOpenChange,
}: RecurringTransactionFormProps) {
  const createMutation = useCreateRecurringTransaction();
  const form = useForm<RecurringTransactionFormSchema>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: {
      description: "",
      amount: "",
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      userAccountId: "",
      categoryId: undefined,
      payeeId: undefined,
    },
  });
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "categoryId" && value.categoryId) {
        const selectedCategory = categories.find(
          (cat) => cat.id === value.categoryId,
        );

        console.log("Selected category full info:", selectedCategory);
      }
    });

    return () => subscription.unsubscribe();
  }, [categories, form]);

  const watchedCategoryId = form.watch("categoryId");
  const selectedCategory = categories.find(
    (cat) => cat.id === watchedCategoryId,
  );

  const onSubmit = async (data: RecurringTransactionFormSchema) => {
    console.log(data);

    const submitData = { ...data, currency: "MXN" };

    createMutation.mutate(submitData);
  };

  const frequencyOptions = [
    { value: "daily", label: "Diario" },
    { value: "weekly", label: "Semanal" },
    { value: "biweekly", label: "Quincenal" },
    { value: "monthly", label: "Mensual" },
    { value: "quarterly", label: "Trimestral" },
    { value: "semester", label: "Semestral" },
    { value: "yearly", label: "Anual" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion</FormLabel>
              <FormControl>
                <Input placeholder="Netflix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="billingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha estimada de cobro</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
                {/* <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={() => {
                        console.log(field.value)
                        field.onChange}}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover> */}
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
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <MyCombobox
                  options={categories.map((cat) => ({
                    value: cat.id.toString(),
                    label: cat.name,
                  }))}
                  onChange={(value) => {
                    const numericValue = Number(value);
                    field.onChange(numericValue); // ✅ inform RHF about the value
                  }}
                  value={field.value?.toString() || ""}
                  placeholder="Seleccione una categoria"
                  searchPlaceholder="Buscar categoria"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedCategory && (
          <div className="text-muted-foreground text-sm">
            <p>Esta transaccion es un:</p>
            <p>
              <strong>
                {selectedCategory?.isIncome ? (
                  <span className="text-green-500">Ingreso</span>
                ) : (
                  <span className="text-red-500">Gasto</span>
                )}
              </strong>
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione la frecuencia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha estimada de termino</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
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
              <FormLabel>Cuenta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione una cuenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="payeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beneficiario</FormLabel>
              <FormControl>
                <MyCombobox
                  options={payees.map((payee) => ({
                    value: payee.id.toString(),
                    label: payee.name,
                  }))}
                  value={field.value?.toString() || ""}
                  placeholder="Selecciona un beneficiario"
                  searchPlaceholder="Buscar beneficiario"
                  onChange={(value) => {
                    const numericValue = Number(value);
                    field.onChange(numericValue);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saveLoading}>
            {saveLoading
              ? "Registrando..."
              : editingRecurringTransactionId
                ? "Actualizando"
                : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
