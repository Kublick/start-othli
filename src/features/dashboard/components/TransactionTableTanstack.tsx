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
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAccounts } from "@/features/dashboard/api/accounts";
import { useCategories } from "@/features/dashboard/api/categories";
import { usePayees } from "@/features/dashboard/api/payees";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";
import { useUpdateTransaction } from "@/features/dashboard/api/transactions";

// Props interface for the component
interface TransactionTableTanstackProps {
  transactions: Transaction[];
  onOpenTransactionSheet: (transaction: Transaction) => void;
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
    return format(date, "dd MMM yyyy", { locale: es });
  } catch {
    return dateString;
  }
};

// Transaction type options
const transactionTypeOptions = [
  { value: "income", label: "Ingreso" },
  { value: "expense", label: "Gasto" },
  { value: "transfer", label: "Transferencia" },
];

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

export function TransactionTableTanstack({
  transactions = [],
  onOpenTransactionSheet,
}: TransactionTableTanstackProps) {
  // Fetch data using hooks
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: payees = [], isLoading: payeesLoading } = usePayees();

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
              notes: transaction.notes || undefined,
              userAccountId: transaction.userAccountId || "",
              categoryId: transaction.categoryId || undefined,
              payeeId: transaction.payeeId || undefined,
              isTransfer: transaction.isTransfer,
              transferAccountId: transaction.transferAccountId || undefined,
            });
          }
        };

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-full justify-start text-left font-normal"
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

    // Description column with inline editing
    columnHelper.accessor("description", {
      header: "Descripción",
      cell: ({ row }) => (
        <EditableDescription
          transaction={row.original}
          onUpdate={(data) => updateTransactionMutation.mutate(data)}
        />
      ),
    }),

    // Amount column with inline editing
    columnHelper.accessor("amount", {
      header: "Monto",
      cell: ({ row }) => (
        <EditableAmount
          transaction={row.original}
          onUpdate={(data) => updateTransactionMutation.mutate(data)}
        />
      ),
    }),

    // Type column with select
    columnHelper.accessor("type", {
      header: "Tipo",
      cell: ({ row }) => {
        const transaction = row.original;
        const value = transaction.type;

        const handleChange = (newValue: Transaction["type"]) => {
          updateTransactionMutation.mutate({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            type: newValue,
            currency: transaction.currency,
            date: transaction.date,
            notes: transaction.notes || undefined,
            userAccountId: transaction.userAccountId || "",
            categoryId: transaction.categoryId || undefined,
            payeeId: transaction.payeeId || undefined,
            isTransfer: transaction.isTransfer,
            transferAccountId: transaction.transferAccountId || undefined,
          });
        };

        return (
          <select
            className="w-full rounded border px-2 py-1 text-sm"
            value={value}
            onChange={(e) =>
              handleChange(e.target.value as Transaction["type"])
            }
          >
            {transactionTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      },
    }),

    // Account column with select
    columnHelper.accessor("userAccountId", {
      header: "Cuenta",
      cell: ({ row }) => {
        const transaction = row.original;
        const value = transaction.userAccountId;

        const handleChange = (newValue: string) => {
          updateTransactionMutation.mutate({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            currency: transaction.currency,
            date: transaction.date,
            notes: transaction.notes || undefined,
            userAccountId: newValue,
            categoryId: transaction.categoryId || undefined,
            payeeId: transaction.payeeId || undefined,
            isTransfer: transaction.isTransfer,
            transferAccountId: transaction.transferAccountId || undefined,
          });
        };

        return (
          <select
            className="w-full rounded border px-2 py-1 text-sm"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">Sin cuenta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.displayName || account.name}
              </option>
            ))}
          </select>
        );
      },
    }),

    // Category column with select
    columnHelper.accessor("categoryId", {
      header: "Categoría",
      cell: ({ row }) => {
        const transaction = row.original;
        const value = transaction.categoryId;

        const handleChange = (newValue: number | null) => {
          updateTransactionMutation.mutate({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            currency: transaction.currency,
            date: transaction.date,
            notes: transaction.notes || undefined,
            userAccountId: transaction.userAccountId || "",
            categoryId: newValue || undefined,
            payeeId: transaction.payeeId || undefined,
            isTransfer: transaction.isTransfer,
            transferAccountId: transaction.transferAccountId || undefined,
          });
        };

        return (
          <select
            className="w-full rounded border px-2 py-1 text-sm"
            value={value || ""}
            onChange={(e) =>
              handleChange(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        );
      },
    }),

    // Payee column with select
    columnHelper.accessor("payeeId", {
      header: "Beneficiario",
      cell: ({ row }) => {
        const transaction = row.original;
        const value = transaction.payeeId;

        const handleChange = (newValue: number | null) => {
          updateTransactionMutation.mutate({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            currency: transaction.currency,
            date: transaction.date,
            notes: transaction.notes || undefined,
            userAccountId: transaction.userAccountId || "",
            categoryId: transaction.categoryId || undefined,
            payeeId: newValue || undefined,
            isTransfer: transaction.isTransfer,
            transferAccountId: transaction.transferAccountId || undefined,
          });
        };

        return (
          <select
            className="w-full rounded border px-2 py-1 text-sm"
            value={value || ""}
            onChange={(e) =>
              handleChange(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Sin beneficiario</option>
            {payees.map((payee) => (
              <option key={payee.id} value={payee.id}>
                {payee.name}
              </option>
            ))}
          </select>
        );
      },
    }),

    // Actions column
    columnHelper.display({
      id: "actions",
      header: "",
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
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer p-3 text-left font-medium"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-muted/50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
