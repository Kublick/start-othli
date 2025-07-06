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
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";
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

// Transaction Summary Component (collapsible)
function TransactionSummaryPanel({
  transactions,
  categories,
  monthLabel,
}: {
  transactions: Transaction[];
  categories: { id: number; name: string }[];
  monthLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Calculate expenses by category
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense" && t.categoryId)
    .reduce(
      (acc, transaction) => {
        const categoryId = transaction.categoryId!;
        const categoryName =
          categories.find((c) => c.id === categoryId)?.name || "Sin categoría";
        const amount = Number.parseFloat(transaction.amount) || 0;
        if (!acc[categoryName]) acc[categoryName] = 0;
        acc[categoryName] += amount;
        return acc;
      },
      {} as Record<string, number>,
    );
  const sortedExpenses = Object.entries(expensesByCategory).sort(
    ([, a], [, b]) => b - a,
  );
  const expensesTotal = sortedExpenses.reduce(
    (sum, [, amount]) => sum + amount,
    0,
  );

  // Calculate income by category
  const incomeByCategory = transactions
    .filter((t) => t.type === "income" && t.categoryId)
    .reduce(
      (acc, transaction) => {
        const categoryId = transaction.categoryId!;
        const categoryName =
          categories.find((c) => c.id === categoryId)?.name || "Sin categoría";
        const amount = Number.parseFloat(transaction.amount) || 0;
        if (!acc[categoryName]) acc[categoryName] = 0;
        acc[categoryName] += amount;
        return acc;
      },
      {} as Record<string, number>,
    );
  const sortedIncome = Object.entries(incomeByCategory).sort(
    ([, a], [, b]) => b - a,
  );
  const incomeTotal = sortedIncome.reduce((sum, [, amount]) => sum + amount, 0);

  // Net income
  const netIncome = incomeTotal - expensesTotal;

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-end">
        <button
          type="button"
          className="ml-2 rounded-full border bg-white p-1 shadow transition hover:bg-muted"
          onClick={() => setCollapsed(false)}
          aria-label="Mostrar resumen"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex w-80 min-w-[18rem] max-w-xs flex-col gap-2 rounded-xl border bg-white p-4 shadow">
      {/* Header with collapse button */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
          {monthLabel} Resumen
        </span>
        <button
          type="button"
          className="ml-2 rounded-full border bg-white p-1 shadow transition hover:bg-muted"
          onClick={() => setCollapsed(true)}
          aria-label="Ocultar resumen"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="mb-2 border-b" />
      {/* Expenses */}
      <div className="mb-1 font-bold text-muted-foreground text-xs">GASTOS</div>
      <div className="mb-2 flex flex-col gap-1">
        {sortedExpenses.length > 0 ? (
          sortedExpenses.map(([category, amount]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="font-medium text-primary text-sm">
                {category}
              </span>
              <span className="font-mono text-red-600 text-sm">
                -{formatCurrency(amount.toString())}
              </span>
            </div>
          ))
        ) : (
          <div className="py-2 text-muted-foreground text-sm">
            No hay gastos categorizados
          </div>
        )}
      </div>
      {/* Income */}
      <div className="mt-2 mb-1 font-bold text-muted-foreground text-xs">
        INGRESOS
      </div>
      <div className="mb-2 flex flex-col gap-1">
        {sortedIncome.length > 0 ? (
          sortedIncome.map(([category, amount]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="font-medium text-primary text-sm">
                {category}
              </span>
              <span className="font-mono text-green-600 text-sm">
                +{formatCurrency(amount.toString())}
              </span>
            </div>
          ))
        ) : (
          <div className="py-2 text-muted-foreground text-sm">
            No hay ingresos categorizados
          </div>
        )}
      </div>
      <div className="my-2 border-t border-dashed" />
      <div className="flex justify-between font-semibold text-sm">
        <span>Total Gastos</span>
        <span className="font-mono text-green-600">
          -{formatCurrency(expensesTotal.toString())}
        </span>
      </div>
      <div className="flex justify-between font-semibold text-sm">
        <span>Saldo Neto</span>
        <span className="font-mono text-green-600">
          {netIncome < 0 ? "-" : ""}
          {formatCurrency(Math.abs(netIncome).toString())}
        </span>
      </div>
    </div>
  );
}

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

// SortableHeader component
function SortableHeader({
  columnId,
  children,
}: {
  columnId: string;
  children: React.ReactNode;
}) {
  const table = useReactTableContext();
  const column = table.getColumn(columnId);
  const isSorted = column.getIsSorted();
  return (
    <button
      type="button"
      className="group flex items-center gap-1 rounded border border-transparent px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide transition hover:border-primary/20 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      onClick={() => column.toggleSorting(isSorted === "asc")}
      tabIndex={0}
    >
      {children}
      {isSorted === "asc" ? (
        <ChevronUp className="h-3 w-3 text-primary" />
      ) : isSorted === "desc" ? (
        <ChevronDown className="h-3 w-3 text-primary" />
      ) : (
        <ChevronUp className="h-3 w-3 text-muted-foreground opacity-40" />
      )}
    </button>
  );
}

// Provide table context for SortableHeader
const TableContext = React.createContext<any>(null);
function useReactTableContext() {
  const ctx = React.useContext(TableContext);
  if (!ctx) throw new Error("SortableHeader must be used within TableContext");
  return ctx;
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
      header: () => <SortableHeader columnId="date">Fecha</SortableHeader>,
      enableSorting: true,
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
      header: () => (
        <SortableHeader columnId="categoryId">Categoría</SortableHeader>
      ),
      enableSorting: true,
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
      header: () => (
        <SortableHeader columnId="payeeId">Beneficiario</SortableHeader>
      ),
      enableSorting: true,
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
      header: () => (
        <SortableHeader columnId="description">Descripción</SortableHeader>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <EditableDescription
          transaction={row.original}
          onUpdate={(data) => updateTransactionMutation.mutate(data)}
        />
      ),
    }),
    // Account column with MyCombobox
    columnHelper.accessor("userAccountId", {
      header: () => (
        <SortableHeader columnId="userAccountId">Cuenta</SortableHeader>
      ),
      enableSorting: true,
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
      header: () => <SortableHeader columnId="amount">Monto</SortableHeader>,
      enableSorting: true,
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

  // Get current month label for summary (in Spanish)
  const monthLabel = (() => {
    if (transactions.length === 0) return "";
    const first = transactions[0];
    const date = new Date(first.date);
    return date.toLocaleString("es-ES", { month: "long", year: "numeric" });
  })();

  return (
    <TableContext.Provider value={table}>
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
        {/* Table and Summary Layout */}
        <div className="flex gap-6">
          {/* Table Section */}
          <div className="flex-1 space-y-4 overflow-x-auto">
            <div className="min-w-[700px] rounded-md border">
              <Table className="min-w-full" style={{ tableLayout: "auto" }}>
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
                  de {(table.getFilteredRowModel()?.rows || []).length}{" "}
                  resultados
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

          {/* Summary Section */}
          <TransactionSummaryPanel
            transactions={transactions}
            categories={categories}
            monthLabel={monthLabel}
          />
        </div>
      </div>
    </TableContext.Provider>
  );
}

export default TransactionTableTanstack;
