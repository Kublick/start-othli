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
import { Calendar, ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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
import { usePayees } from "@/features/dashboard/api/payees";
import type { Transaction } from "@/features/dashboard/api/transactions";
import { useUpdateTransaction } from "@/features/dashboard/api/transactions";
import { cn } from "@/lib/utils";
import AccountCell from "./AccountCell";
import CategoryCell from "./CategoryCell";
import EditableAmount from "./EditableAmount";
import EditableDescription from "./EditableDescription";
import PayeeCell from "./PayeeCell";
import { TableContext } from "./TransactionTableHeader";

// Props interface for the component
interface TransactionTableTanstackProps {
  transactions: Transaction[];
  onOpenTransactionSheet: (transaction: Transaction) => void;
  createPayee: (name: string) => Promise<number | undefined>;
}

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
  const isSorted = column?.getIsSorted();
  return (
    <button
      type="button"
      className="group flex items-center gap-1 rounded border border-transparent px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide transition hover:border-primary/20 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      onClick={() => column?.toggleSorting(isSorted === "asc")}
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

  const { data: categories = [], isLoading: categoriesLoading } =
    useActiveCategories();
  const { mutateAsync: createCategoryMutation } = useCreateCategories();

  const createCategory = async (name: string): Promise<number | undefined> => {
    const createdCategories = await createCategoryMutation({
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
    return createdCategories?.[0]?.id;
  };
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
              description: transaction.description ?? "",
              amount: transaction.amount,
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
        </div>
      </div>
    </TableContext.Provider>
  );
}

export default TransactionTableTanstack;
