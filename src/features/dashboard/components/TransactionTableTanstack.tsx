import type { UseMutationResult } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MyCombobox } from "@/components/ui/my-combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveAccounts } from "@/features/dashboard/api/accounts";
import {
  useActiveCategories,
  useCreateCategories,
} from "@/features/dashboard/api/categories";
import type { Payee } from "@/features/dashboard/api/payees";
import { usePayees } from "@/features/dashboard/api/payees";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";
import { useUpdateTransaction } from "@/features/dashboard/api/transactions";
import { cn } from "@/lib/utils";

// Props interface for the component
interface TransactionTableTanstackProps {
  transactions: Transaction[];
  onOpenTransactionSheet: (transaction: Transaction) => void;
  createPayee: (name: string) => Promise<void>;
}

// Helper function to format currency
const formatCurrency = (amount: string, currency = "MXN") => {
  const numAmount = Number.parseFloat(amount);
  if (Number.isNaN(numAmount)) return `${currency}$0.00`;
  return `${currency}$${numAmount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const formatted = format(date, "EEE MMM d", { locale: es });

    return formatted.replace(/(^|\s)([a-z])/g, (match) => match.toUpperCase());
  } catch {
    return dateString;
  }
};

// Editable cell components
const EditableDescription = ({
  transaction,
  onUpdate,
}: {
  transaction: Transaction;
  onUpdate: (data: UpdateTransactionData) => void;
}) => {
  const [value, setValue] = useState(transaction.description);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== transaction.description) {
      onUpdate({
        ...transaction,
        description: value,
        notes: transaction.notes ?? undefined,
        userAccountId: transaction.userAccountId || "",
        categoryId: transaction.categoryId ?? undefined,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setValue(transaction.description);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        className="w-full rounded border px-2 py-1 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <button
      type="button"
      className="w-full cursor-pointer rounded p-1 text-left hover:bg-muted/50"
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {value || "Sin descripción"}
    </button>
  );
};

const EditableAmount = ({
  transaction,
  onUpdate,
}: {
  transaction: Transaction;
  onUpdate: (data: UpdateTransactionData) => void;
}) => {
  const [value, setValue] = useState(transaction.amount);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== transaction.amount) {
      onUpdate({
        ...transaction,
        amount: value,
        notes: transaction.notes ?? undefined,
        userAccountId: transaction.userAccountId || "",
        categoryId: transaction.categoryId ?? undefined,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setValue(transaction.amount);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        className="w-full rounded border px-2 py-1 text-right text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <button
      type="button"
      className="w-full cursor-pointer rounded p-1 text-right hover:bg-muted/50"
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {formatCurrency(value, transaction.currency)}
    </button>
  );
};

function PayeeCell({
  transaction,
  payees,
  createPayee,
  refetchPayees,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  payees: Payee[];
  createPayee: (name: string) => Promise<void>;
  refetchPayees: () => Promise<{ data?: Payee[] }>;
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) {
  const payeeOptions = payees.map((p) => ({
    value: p.id.toString(),
    label: p.name,
  }));
  const initialValue = transaction.payeeId
    ? transaction.payeeId.toString()
    : "";
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = async (newValue: string) => {
    setValue(newValue); // Optimistically update UI
    let payeeId = Number(newValue);
    if (!payees.some((p) => p.id === payeeId)) {
      await createPayee(newValue);
      const updatedPayees = await refetchPayees();
      const newPayee = updatedPayees.data?.find(
        (p) => p.name.toLowerCase() === newValue.toLowerCase(),
      );
      if (newPayee) {
        payeeId = newPayee.id;
      }
    }
    updateTransactionMutation.mutate({
      ...transaction,
      payeeId: payeeId || undefined,
      notes: transaction.notes ?? undefined,
      userAccountId: transaction.userAccountId || "",
      categoryId: transaction.categoryId ?? undefined,
      transferAccountId: transaction.transferAccountId ?? undefined,
    });
  };

  return (
    <MyCombobox
      options={payeeOptions}
      value={value}
      onChange={handleChange}
      allowCreate
      placeholder="Selecciona o busca beneficiario"
    />
  );
}

function CategoryCell({
  transaction,
  categories,
  createCategory,
  refetchCategories,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  categories: { id: number; name: string }[];
  createCategory: (name: string) => Promise<void>;
  refetchCategories: () => Promise<{ data?: { id: number; name: string }[] }>;
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) {
  const categoryOptions = categories.map((c) => ({
    value: c.id.toString(),
    label: c.name,
  }));
  const initialValue = transaction.categoryId
    ? transaction.categoryId.toString()
    : "";
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = async (newValue: string) => {
    setValue(newValue); // Optimistically update UI
    let categoryId = Number(newValue);
    if (!categories.some((c) => c.id === categoryId)) {
      await createCategory(newValue);
      const updatedCategories = await refetchCategories();
      const newCategory = updatedCategories.data?.find(
        (c) => c.name.toLowerCase() === newValue.toLowerCase(),
      );
      if (newCategory) {
        categoryId = newCategory.id;
      }
    }
    updateTransactionMutation.mutate({
      ...transaction,
      categoryId: categoryId || undefined,
      notes: transaction.notes ?? undefined,
      userAccountId: transaction.userAccountId || "",
      payeeId: transaction.payeeId ?? undefined,
      transferAccountId: transaction.transferAccountId ?? undefined,
    });
  };

  return (
    <MyCombobox
      options={categoryOptions}
      value={value}
      onChange={handleChange}
      allowCreate
      placeholder="Sin categoría"
    />
  );
}

function AccountCell({
  transaction,
  accounts,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  accounts: { id: string; name: string }[];
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) {
  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  const handleChange = async (newValue: string) => {
    if (newValue === transaction.userAccountId) return;

    try {
      await updateTransactionMutation.mutateAsync({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        currency: transaction.currency,
        date: transaction.date,
        notes: transaction.notes ?? undefined,
        userAccountId: newValue,
        categoryId: transaction.categoryId ?? undefined,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  return (
    <MyCombobox
      options={accountOptions}
      value={transaction.userAccountId || ""}
      onChange={handleChange}
      placeholder="Seleccionar cuenta"
    />
  );
}

export function TransactionTableTanstack({
  transactions = [],
  onOpenTransactionSheet,
  createPayee,
}: TransactionTableTanstackProps) {
  // Fetch data using hooks

  const { data: accounts = [], isLoading: accountsLoading } =
    useActiveAccounts();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useActiveCategories();
  const { mutateAsync: createCategoryMutation } = useCreateCategories();

  const createCategory = async (name: string) => {
    await createCategoryMutation({
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
  };
  const {
    data: payees = [],
    isLoading: payeesLoading,
    refetch: refetchPayees,
  } = usePayees();

  // Use mutation hooks
  const updateTransactionMutation = useUpdateTransaction();

  const [sorting, setSorting] = useState<
    import("@tanstack/react-table").SortingState
  >([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<
    import("@tanstack/react-table").PaginationState
  >({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<Transaction>();

  const columns = [
    // Date column with calendar picker
    columnHelper.accessor("date", {
      header: "Fecha",
      size: 60,
      cell: ({ row }) => {
        const transaction = row.original;
        const currentDate = transaction.date;

        const handleDateSelect = (date: Date | undefined) => {
          if (date) {
            const formattedDate = format(date, "yyyy-MM-dd");
            updateTransactionMutation.mutate({
              id: transaction.id,
              description: transaction.description,
              amount: transaction.amount,
              type: transaction.type,
              currency: transaction.currency,
              date: formattedDate,
              notes: transaction.notes ?? undefined,
              userAccountId: transaction.userAccountId || "",
              categoryId: transaction.categoryId ?? undefined,
              payeeId: transaction.payeeId ?? undefined,
              transferAccountId: transaction.transferAccountId ?? undefined,
            });
          }
        };

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !transaction && "text-muted-foreground",
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {currentDate ? formatDate(currentDate) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={currentDate ? new Date(currentDate) : undefined}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
        );
      },
    }),
    // Category column with MyCombobox
    columnHelper.accessor("categoryId", {
      header: "Categoría",
      size: 120,
      cell: ({ row }) => (
        <CategoryCell
          transaction={row.original}
          categories={categories}
          createCategory={createCategory}
          refetchCategories={refetchCategories}
          updateTransactionMutation={updateTransactionMutation}
        />
      ),
    }),
    // Payee column with MyCombobox
    columnHelper.accessor("payeeId", {
      size: 150,
      header: "Beneficiario",
      cell: ({ row }) => (
        <PayeeCell
          transaction={row.original}
          payees={payees}
          createPayee={createPayee}
          refetchPayees={refetchPayees}
          updateTransactionMutation={updateTransactionMutation}
        />
      ),
    }),
    // Description column with inline editing
    columnHelper.accessor("description", {
      header: "Descripción",
      size: 200,
      cell: ({ row }) => (
        <EditableDescription
          transaction={row.original}
          onUpdate={(data) => updateTransactionMutation.mutate(data)}
        />
      ),
    }),
    // Account column with MyCombobox
    columnHelper.accessor("userAccountId", {
      header: "Cuenta",
      size: 120,
      cell: ({ row }) => (
        <AccountCell
          transaction={row.original}
          accounts={accounts}
          updateTransactionMutation={updateTransactionMutation}
        />
      ),
    }),
    // Amount column with inline editing
    columnHelper.accessor("amount", {
      size: 90,
      header: "Monto",
      cell: ({ row }) => (
        <EditableAmount
          transaction={row.original}
          onUpdate={(data) => updateTransactionMutation.mutate(data)}
        />
      ),
    }),
    // Actions column
    columnHelper.display({
      id: "actions",
      header: "",
      size: 40,
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenTransactionSheet(transaction)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Show loading state if any data is still loading
  if (accountsLoading || categoriesLoading || payeesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="font-medium text-lg">Cargando datos...</div>
          <div className="text-muted-foreground text-sm">Espera un momento</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Global Filter */}
      <div className="flex items-center gap-4">
        <input
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar transacciones..."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table style={{ tableLayout: "fixed" }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }} // Use the size from columnDef
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Uh ho no hay resultados aun...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>
            Mostrando{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{" "}
            a{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              (table.getFilteredRowModel()?.rows || []).length,
            )}{" "}
            de {(table.getFilteredRowModel()?.rows || []).length} resultados
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </Button>
          <span className="text-sm">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {">>"}
          </Button>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded-md border px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize} por página
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default TransactionTableTanstack;
