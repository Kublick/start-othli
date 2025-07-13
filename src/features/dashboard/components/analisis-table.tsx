import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type Row,
  type SortingFn,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  endOfMonth,
  endOfToday,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Category } from "@/features/dashboard/api/categories";
import type { Transaction } from "@/features/dashboard/api/transactions";

interface AnalisisTableProps {
  categories: Category[];
  transactions: Transaction[];
}

// Define a more generic DateInfo type that can represent both months and days
type DateInfo = {
  label: string;
  year: number;
  month: number;
  day?: number;
  key: string; // e.g. '2024-06' for months or '2024-06-15' for days
};

// Row data type
type RowData = {
  category: string;
  categoryId: number;
  // For each date period: value
  [dateKey: string]: number | string | undefined;
};

// Custom meta type for sticky columns
type StickyMeta = { sticky?: "left" | "right" };

// Reusable component for currency cells
const CurrencyCell: React.FC<{ value: unknown }> = ({ value }) => {
  if (value === "-") return <span className="text-muted-foreground">-</span>;
  return (
    <span className="font-mono">{currencyFormatter.format(Number(value))}</span>
  );
};

// Generic numeric sorting function for columns
const numericSort: SortingFn<RowData> = (
  rowA: Row<RowData>,
  rowB: Row<RowData>,
  columnId: string,
) => {
  const a = rowA.getValue(columnId);
  const b = rowB.getValue(columnId);
  if (a === "-" && b === "-") return 0;
  if (a === "-") return 1;
  if (b === "-") return -1;
  return (a as number) - (b as number);
};

// Helper functions for date formatting
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

function getDayLabel(date: Date): string {
  return date.toLocaleString("default", { day: "numeric", month: "short" });
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

// Define a constant width for summary columns
const SUMMARY_COL_WIDTH = 120;

export default function AnalisisTable({
  categories,
  transactions,
}: AnalisisTableProps) {
  // Date selector state
  type DateRange = { from: Date; to: Date };
  // Add 14 days option
  const PRESETS = [
    { label: "Este Mes", value: "month", viewMode: "months" },
    { label: "Año hasta la fecha", value: "ytd", viewMode: "months" },
    { label: "Últimos 7 días", value: "7d", viewMode: "days", days: 7 },
    { label: "Últimos 14 días", value: "14d", viewMode: "days", days: 14 },
    { label: "Últimos 30 días", value: "30d", viewMode: "days", days: 30 },
    { label: "Personalizado", value: "custom", viewMode: "custom" },
  ];
  function getPresetRange(preset: string): DateRange {
    const today = endOfToday();
    switch (preset) {
      case "month":
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case "ytd":
        return { from: startOfYear(today), to: today };
      case "7d":
        return { from: subDays(today, 6), to: today };
      case "14d":
        return { from: subDays(today, 13), to: today };
      case "30d":
        return { from: subDays(today, 29), to: today };
      default:
        return { from: today, to: today };
    }
  }
  const [preset, setPreset] = React.useState<string>("month");
  const [customRange, setCustomRange] = React.useState<DateRange | undefined>(
    undefined,
  );
  const [showCalendar, setShowCalendar] = React.useState(false);
  // Internal view mode and days to show, controlled by dropdown
  const [viewMode, setViewMode] = React.useState<"months" | "days">("months");
  const [daysToShow, setDaysToShow] = React.useState<number>(7);

  React.useEffect(() => {
    const presetObj = PRESETS.find((p) => p.value === preset);
    if (!presetObj) return;
    if (presetObj.viewMode === "months") {
      setViewMode("months");
    } else if (presetObj.viewMode === "days") {
      setViewMode("days");
      setDaysToShow(presetObj.days || 7);
    }
    setShowCalendar(preset === "custom");
  }, [preset]);

  const range = React.useMemo(() => {
    if (preset === "custom" && customRange?.from && customRange?.to) {
      return { from: customRange.from, to: customRange.to };
    }
    return getPresetRange(preset);
  }, [preset, customRange]);

  // Filter transactions by selected date range
  const filteredTransactions = React.useMemo(() => {
    if (!range.from || !range.to) return [];
    const fromTime = range.from.setHours(0, 0, 0, 0);
    const toTime = range.to.setHours(23, 59, 59, 999);
    return transactions.filter((tx) => {
      const txTime = new Date(tx.date).getTime();
      return txTime >= fromTime && txTime <= toTime;
    });
  }, [transactions, range.from, range.to]);

  // Date selector UI (single dropdown)
  const dateSelector = (
    <div className="mb-4 flex max-w-xs flex-col gap-2">
      <Select value={preset} onValueChange={(val) => setPreset(val)}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {PRESETS.find((p) => p.value === preset)?.label ||
              "Seleccionar rango"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {preset === "custom" && showCalendar && (
        <Calendar
          mode="range"
          selected={customRange}
          onSelect={(range) => {
            if (range?.from && range?.to) setCustomRange(range as DateRange);
          }}
          initialFocus
        />
      )}
    </div>
  );

  // Generate date periods based on viewMode
  const datePeriods: DateInfo[] = React.useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    // Find min and max date
    let minDate = new Date(filteredTransactions[0].date);
    let maxDate = new Date(filteredTransactions[0].date);

    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });

    if (viewMode === "months") {
      // Generate all months between minDate and maxDate (inclusive)
      const periodsArr: DateInfo[] = [];
      let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

      while (current <= end) {
        const key = getMonthKey(current);
        periodsArr.push({
          label: getMonthLabel(current),
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          key,
        });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      return periodsArr;
    }
    // For days view, show the last N days (where N is daysToShow)
    const periodsArr: DateInfo[] = [];
    const today = new Date();

    // Start from N days ago
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const key = getDayKey(date);
      periodsArr.push({
        label: getDayLabel(date),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        key,
      });
    }
    return periodsArr;
  }, [filteredTransactions, viewMode, daysToShow]);

  // Build row data: one row per category, with data for each date period
  const data: RowData[] = React.useMemo(() => {
    return categories.map((cat) => {
      const row: RowData = {
        category: cat.name,
        categoryId: cat.id,
      };

      let total = 0;
      let count = 0;

      datePeriods.forEach((period) => {
        // Filter transactions for this category and date period
        const txs = filteredTransactions.filter((tx) => {
          const txDate = new Date(tx.date);
          if (tx.categoryId !== cat.id) return false;

          if (viewMode === "months") {
            // Match by year and month
            return (
              txDate.getFullYear() === period.year &&
              txDate.getMonth() + 1 === period.month
            );
          }
          // Match by exact day
          return (
            txDate.getFullYear() === period.year &&
            txDate.getMonth() + 1 === period.month &&
            txDate.getDate() === period.day
          );
        });

        const sum = txs.reduce((acc, tx) => acc + Number(tx.amount), 0);
        row[period.key] = sum !== 0 ? sum : "-";

        if (sum !== 0) {
          total += sum;
          count++;
        }
      });

      row.average = count > 0 ? total / count : "-";
      row.total = count > 0 ? total : "-";
      const allTxs = filteredTransactions.filter(
        (tx) => tx.categoryId === cat.id,
      );
      row.count = allTxs.length > 0 ? allTxs.length : "-";

      return row;
    });
  }, [categories, filteredTransactions, datePeriods, viewMode]);

  // Define columns: first column is category, then one per date period, then average and total
  const columns = React.useMemo<ColumnDef<RowData>[]>(() => {
    // Create columns for each date period
    const createDateColumns = (): ColumnDef<RowData>[] => {
      return datePeriods.map((period) => ({
        accessorKey: period.key,
        header: period.label, // No calendar icon, just the label
        cell: (info) => <CurrencyCell value={info.getValue()} />,
        enableSorting: true,
        sortingFn: numericSort,
        meta: { width: 90 }, // Custom meta for width
      }));
    };

    // Extra columns (summary section)
    const extraColumns: ColumnDef<RowData>[] = [
      {
        accessorKey: "total",
        header: () => <span>Total</span>,
        cell: (info) => <CurrencyCell value={info.getValue()} />,
        enableSorting: true,
        sortingFn: numericSort,
        meta: { sticky: "right" },
      },
      {
        accessorKey: "average",
        header: () => <span>Promedio</span>,
        cell: (info) => <CurrencyCell value={info.getValue()} />,
        enableSorting: true,
        sortingFn: numericSort,
        meta: { sticky: "right" },
      },
      {
        accessorKey: "count",
        header: () => <span>Transacciones</span>,
        cell: (info) => renderCountCell(info.getValue()),
        enableSorting: false,
        meta: { sticky: "right" },
      },
    ];

    // Static columns
    const staticColumns: ColumnDef<RowData>[] = [
      {
        accessorKey: "category",
        header: "Categoría",
        cell: (info) => info.getValue(),
        enableSorting: true,
        meta: { sticky: "left" },
      },
    ];

    return [...staticColumns, ...createDateColumns(), ...extraColumns];
  }, [datePeriods]);

  // Table state
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

  if (categories.length === 0 || datePeriods.length === 0) {
    return (
      <div className="text-muted-foreground">No hay datos para mostrar.</div>
    );
  }

  return (
    <div>
      {dateSelector}
      <div className="relative mx-auto max-w-screen-2xl overflow-hidden rounded-lg border text-sm">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, colIdx) => {
                    const sticky = (header.column.columnDef.meta as StickyMeta)
                      ?.sticky;
                    // Set width for date columns
                    let style: React.CSSProperties = {};
                    if ((header.column.columnDef.meta as any)?.width === 90) {
                      style = { minWidth: 90, maxWidth: 90 };
                    } else {
                      style = { minWidth: 120, maxWidth: 180 };
                    }
                    if (sticky === "right") {
                      // Calculate position for right-sticky columns (reverse order)
                      const rightStickyHeaders = headerGroup.headers.filter(
                        (h) =>
                          (h.column.columnDef.meta as StickyMeta)?.sticky ===
                          "right",
                      );
                      const rightIndex =
                        rightStickyHeaders.length -
                        1 -
                        rightStickyHeaders.findIndex((h) => h.id === header.id);
                      const rightOffset = rightIndex * SUMMARY_COL_WIDTH;

                      style = {
                        ...style,
                        position: "sticky",
                        right: `${rightOffset}px`,
                        zIndex: 30,
                        backgroundColor: "white",
                        boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.1)",
                      };
                    } else if (sticky === "left") {
                      style = {
                        ...style,
                        position: "sticky",
                        left: 0,
                        zIndex: 20,
                        backgroundColor: "white",
                        boxShadow: "2px 0 4px -2px rgba(0,0,0,0.1)",
                      };
                    }

                    // Add left border to summary columns
                    const isSummary =
                      header.column.id === "total" ||
                      header.column.id === "average" ||
                      header.column.id === "count";

                    const isFirstCol = colIdx === 0;
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`cursor-pointer select-none border px-2 py-1${isSummary ? " border-l" : ""} overflow-hidden truncate whitespace-nowrap ${isFirstCol ? "bg-gray-100" : ""} bg-gray-50`}
                        style={style}
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
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell, colIdx, arr) => {
                    const sticky = (cell.column.columnDef.meta as StickyMeta)
                      ?.sticky;
                    // Set width for date columns
                    let style: React.CSSProperties = {};
                    if ((cell.column.columnDef.meta as any)?.width === 90) {
                      style = { minWidth: 90, maxWidth: 90 };
                    } else {
                      style = { minWidth: 120, maxWidth: 180 };
                    }
                    if (sticky === "right") {
                      // Calculate position for right-sticky columns (reverse order)
                      const rightStickyCells = row
                        .getVisibleCells()
                        .filter(
                          (c) =>
                            (c.column.columnDef.meta as StickyMeta)?.sticky ===
                            "right",
                        );
                      const rightIndex =
                        rightStickyCells.length -
                        1 -
                        rightStickyCells.findIndex((c) => c.id === cell.id);
                      const rightOffset = rightIndex * SUMMARY_COL_WIDTH;

                      style = {
                        ...style,
                        position: "sticky",
                        right: `${rightOffset}px`,
                        zIndex: 10,
                        backgroundColor: "white",
                        boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.1)",
                      };
                    } else if (sticky === "left") {
                      style = {
                        ...style,
                        position: "sticky",
                        left: 0,
                        zIndex: 10,
                        backgroundColor: "white",
                        boxShadow: "2px 0 4px -2px rgba(0,0,0,0.1)",
                      };
                    }

                    // Add left border to summary columns
                    const isSummary =
                      cell.column.id === "total" ||
                      cell.column.id === "average" ||
                      cell.column.id === "count";

                    const isFirstCol = colIdx === 0;
                    // Align numeric columns to the left
                    const isNumeric =
                      cell.column.id === "count" ||
                      cell.column.id === "total" ||
                      cell.column.id === "average" ||
                      datePeriods.some((p) => p.key === cell.column.id);
                    return (
                      <td
                        key={cell.id}
                        className={`border px-2 py-1${isSummary ? " border-l" : ""} overflow-hidden truncate whitespace-nowrap ${isFirstCol ? "bg-gray-100" : ""} ${isNumeric ? "text-right" : ""}`}
                        style={style}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
