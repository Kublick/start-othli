import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/features/dashboard/api/categories";
import type { Transaction } from "@/features/dashboard/api/transactions";

interface AnalisisTableProps {
  categories: Category[];
  transactions: Transaction[];
}

type MonthInfo = {
  label: string;
  year: number;
  month: number;
  key: string; // e.g. '2024-06'
};

// 1. Update RowData type to include counts
type RowData = {
  category: string;
  categoryId: number;
  // For each month: value and count
  [monthKey: string]: number | string | undefined;
  // e.g. '2024-06_count': number
};

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

// Currency formatter for MXN
const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
});

// Helper for count cell rendering
function renderCountCell(value: unknown) {
  if (value === "-") return <span className="text-muted-foreground">-</span>;
  return <span className="font-mono">{value as number}</span>;
}

export default function AnalisisTable({
  categories,
  transactions,
}: AnalisisTableProps) {
  // 1. Generate unique months from transactions (now: fill all months in range)
  const months: MonthInfo[] = React.useMemo(() => {
    if (transactions.length === 0) return [];
    // Find min and max date
    let minDate = new Date(transactions[0].date);
    let maxDate = new Date(transactions[0].date);
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });
    // Generate all months between minDate and maxDate (inclusive)
    const monthsArr: MonthInfo[] = [];
    let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    while (current <= end) {
      const key = getMonthKey(current);
      monthsArr.push({
        label: getMonthLabel(current),
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        key,
      });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return monthsArr;
  }, [transactions]);

  // 2. Build row data: one row per category, each month column is sum of transactions
  const data: RowData[] = React.useMemo(() => {
    return categories.map((cat) => {
      const row: RowData = {
        category: cat.name,
        categoryId: cat.id,
      };
      let total = 0;
      let count = 0;
      months.forEach((m) => {
        // Transactions for this category and month
        const txs = transactions.filter(
          (tx) =>
            tx.categoryId === cat.id &&
            (() => {
              const d = new Date(tx.date);
              return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
            })(),
        );
        const sum = txs.reduce((acc, tx) => acc + Number(tx.amount), 0);
        row[m.key] = sum !== 0 ? sum : "-";
        if (sum !== 0) {
          total += sum;
          count++;
        }
      });

      row.average = count > 0 ? total / count : "-";
      row.total = count > 0 ? total : "-";
      const allTxs = transactions.filter((tx) => tx.categoryId === cat.id);
      row.count = allTxs.length > 0 ? allTxs.length : "-";
      return row;
    });
  }, [categories, transactions, months]);

  // 3. Define columns: first column is category, then one per month, then average and total
  const columns = React.useMemo<ColumnDef<RowData>[]>(() => {
    // For each month, add value column only
    const monthColumns: ColumnDef<RowData>[] = months.map((m) => ({
      accessorKey: m.key,
      header: m.label,
      cell: (info) => {
        const value = info.getValue();
        if (value === "-")
          return <span className="text-muted-foreground">-</span>;
        return (
          <span className="font-mono">
            {currencyFormatter.format(Number(value))}
          </span>
        );
      },
      enableSorting: true,
      sortingFn: (rowA, rowB, columnId) => {
        // Sort by value, treating '-' as lowest
        const a = rowA.getValue(columnId);
        const b = rowB.getValue(columnId);
        if (a === "-" && b === "-") return 0;
        if (a === "-") return 1;
        if (b === "-") return -1;
        return (a as number) - (b as number);
      },
    }));
    // Average, total, and count columns (summary section)
    const extraColumns: ColumnDef<RowData>[] = [
      {
        accessorKey: "average",
        header: () => <span>Promedio</span>,
        cell: (info) => {
          const value = info.getValue();
          if (value === "-")
            return <span className="text-muted-foreground">-</span>;
          return (
            <span className="font-mono">
              {currencyFormatter.format(Number(value))}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId);
          const b = rowB.getValue(columnId);
          if (a === "-" && b === "-") return 0;
          if (a === "-") return 1;
          if (b === "-") return -1;
          return (a as number) - (b as number);
        },
      },
      {
        accessorKey: "total",
        header: () => <span>Total</span>,
        cell: (info) => {
          const value = info.getValue();
          if (value === "-")
            return <span className="text-muted-foreground">-</span>;
          return (
            <span className="font-mono">
              {currencyFormatter.format(Number(value))}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId);
          const b = rowB.getValue(columnId);
          if (a === "-" && b === "-") return 0;
          if (a === "-") return 1;
          if (b === "-") return -1;
          return (a as number) - (b as number);
        },
      },
      {
        accessorKey: "count",
        header: () => <span>#</span>,
        cell: (info) => renderCountCell(info.getValue()),
        enableSorting: false,
      },
    ];
    return [
      {
        accessorKey: "category",
        header: "Categoría",
        cell: (info) => info.getValue(),
        enableSorting: true,
      },
      ...monthColumns,
      ...extraColumns,
    ];
  }, [months]);

  // 4. Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  });

  if (categories.length === 0 || months.length === 0) {
    return (
      <div className="text-muted-foreground">No hay datos para mostrar.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                // Add left border to summary columns
                const isSummary =
                  header.column.id === "average" ||
                  header.column.id === "total" ||
                  header.column.id === "count";
                return (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`cursor-pointer select-none${isSummary ? " border-l pl-2" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === "asc" && (
                        <ChevronUp className="h-3 w-3" />
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                // Add left border to summary columns
                const isSummary =
                  cell.column.id === "average" ||
                  cell.column.id === "total" ||
                  cell.column.id === "count";
                return (
                  <TableCell
                    key={cell.id}
                    className={isSummary ? "border-l" : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
