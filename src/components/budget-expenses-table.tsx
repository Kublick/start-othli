import {
  type CellContext,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import * as React from "react";
import { useEffect, useState } from "react";
import TransactionsDialog from "@/components/transactions-dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Category } from "@/features/dashboard/api/categories";
import type { Transaction } from "@/features/dashboard/api/transactions";

// Helper for currency formatting
const formatCurrency = (
  value: number | null | undefined,
  placeholder = "MX$0.00",
) => {
  if (value === null || value === undefined || Number.isNaN(value))
    return placeholder;
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface BudgetRow {
  id: number;
  name: string;
  budgeted: number;
  activity: number;
  available: number;
}

interface BudgetCategoryTableProps {
  type: "income" | "expense";
  categories: Category[];
  transactions: Transaction[];
  budgets: Record<number, number>; // categoryId -> budgeted amount
  onBudgetChange: (categoryId: number, value: number) => void | Promise<void>;
}

function ExpectedCell({
  info,
  onBudgetChange,
}: {
  info: CellContext<BudgetRow, number>;
  onBudgetChange: (categoryId: number, value: number) => void | Promise<void>;
}) {
  const rowId = String(info.row.original.id);
  const initialValue = info.getValue();
  const [value, setValue] = useState<string>(
    info.row.original.budgeted?.toString() ?? "",
  );
  const [originalValue, setOriginalValue] = useState<string>(
    info.row.original.budgeted?.toString() ?? "",
  );
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setValue(info.row.original.budgeted?.toString() ?? "");
    setOriginalValue(info.row.original.budgeted?.toString() ?? "");
  }, [info.row.original.budgeted]);

  const handleChange = (newValue: string) => setValue(newValue);

  const handleBlur = async () => {
    if (value !== originalValue) {
      setLoading(true);
      try {
        await onBudgetChange(Number(rowId), +value);
        setOriginalValue(value);
      } catch (e) {
        setValue(originalValue);
        console.log(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      (event.target as HTMLInputElement).blur();
    } else if (event.key === "Escape") {
      setValue(originalValue);
      (event.target as HTMLInputElement).blur();
    }
  };

  if (initialValue === 0 && value === "")
    return <div className="text-right ">{formatCurrency(0)} </div>;

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-28 text-right tabular-nums"
        disabled={loading}
      />
    </div>
  );
}

const TABLE_WIDTH = 1000;
const CATEGORY_WIDTH = Math.floor(TABLE_WIDTH * 0.55);
const OTHER_COLUMNS_WIDTH = Math.floor((TABLE_WIDTH - CATEGORY_WIDTH) / 3);

export const budgetTableColumns: (
  onBudgetChange: BudgetCategoryTableProps["onBudgetChange"],
  transactionsByCategory: Map<number, Transaction[]>,
  categories: Category[],
) => ColumnDef<BudgetRow, number | string>[] = (
  onBudgetChange,
  transactionsByCategory,
  categories,
) => [
  {
    id: "categoryName",
    accessorKey: "name",
    header: () => (
      <div className="pl-4 text-left font-semibold uppercase tracking-wider">
        Gastos
      </div>
    ),
    cell: (info) => (
      <div className="pl-4 font-medium ">{info.getValue<string>()}</div>
    ),
    size: CATEGORY_WIDTH,
  },
  {
    accessorKey: "budgeted",
    header: () => (
      <div className="flex items-center gap-2 font-semibold uppercase tracking-wider hover:text-black">
        Presupuestado
      </div>
    ),
    cell: (info) => (
      <ExpectedCell info={info} onBudgetChange={onBudgetChange} />
    ),
    size: OTHER_COLUMNS_WIDTH,
  },
  {
    accessorKey: "activity",
    header: () => (
      <div className="text-right font-semibold uppercase tracking-wider">
        Actividad
      </div>
    ),
    cell: (info) => {
      const value = info.getValue<number>();
      const categoryId = info.row.original.id;
      const categoryTransactions = transactionsByCategory.get(categoryId) || [];
      const category = categories.find((c) => c.id === categoryId);
      return (
        <div className="relative flex items-center">
          {categoryTransactions.length > 0 && (
            <div className="absolute left-0">
              <TransactionsDialog
                id={categoryId.toString()}
                transactions={categoryTransactions}
                category={category || null}
              />
            </div>
          )}
          <div className="w-full text-right">{formatCurrency(value)}</div>
        </div>
      );
    },
    size: OTHER_COLUMNS_WIDTH,
  },
  {
    accessorKey: "available",
    header: () => (
      <div className="flex items-center justify-end gap-2 text-right font-semibold uppercase tracking-wider hover:text-black">
        Disponible
      </div>
    ),
    cell: (info) => {
      const budgetableAmount = info.getValue<number>();
      let textColor = "";
      if (budgetableAmount > 0) textColor = "text-green-700 font-bold";
      else if (budgetableAmount < 0) textColor = "text-red-700 font-bold";
      else if (budgetableAmount === 0) textColor = "";
      return (
        <div className="w-full text-right">
          <span className={textColor}>{formatCurrency(budgetableAmount)}</span>
        </div>
      );
    },
    size: OTHER_COLUMNS_WIDTH,
  },
];

export function BudgetCategoryTable({
  type,
  categories,
  transactions,
  budgets,
  onBudgetChange,
}: BudgetCategoryTableProps) {
  // Filter categories by type
  const filteredCategories = React.useMemo(
    () =>
      categories.filter((cat) =>
        type === "income" ? cat.isIncome : !cat.isIncome,
      ),
    [categories, type],
  );

  // Memoize transactions by category for performance
  const transactionsByCategory = React.useMemo(() => {
    const map = new Map<number, Transaction[]>();
    transactions.forEach((transaction) => {
      const categoryId = transaction.categoryId ?? 0;
      if (!map.has(categoryId)) {
        map.set(categoryId, []);
      }
      const categoryTransactions = map.get(categoryId);
      if (categoryTransactions) {
        categoryTransactions.push(transaction);
      }
    });
    return map;
  }, [transactions]);

  // Build table data
  const data: BudgetRow[] = React.useMemo(
    () =>
      filteredCategories.map((cat) => {
        let activity = 0;
        const categoryTransactions = transactionsByCategory.get(cat.id) || [];
        if (type === "income") {
          activity = categoryTransactions.reduce((sum, t) => {
            const amt = Number.parseFloat(t.amount);
            return amt > 0 ? sum + amt : sum;
          }, 0);
        } else {
          activity = categoryTransactions.reduce((sum, t) => {
            const amt = Number.parseFloat(t.amount);
            return amt < 0 ? sum + Math.abs(amt) : sum;
          }, 0);
        }
        const budgeted = Number(budgets[cat.id] || 0);
        const available =
          type === "income" ? activity - budgeted : budgeted - activity;
        return {
          id: cat.id,
          name: cat.name,
          budgeted,
          activity,
          available,
        };
      }),
    [filteredCategories, transactionsByCategory, budgets, type],
  );

  const [tableData, setTableData] = useState<BudgetRow[]>([]);
  const [filtering, setFiltering] = useState("");

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns: budgetTableColumns(
      onBudgetChange,
      transactionsByCategory,
      categories,
    ),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => `${row.id}`,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: filtering,
    },
    onGlobalFilterChange: setFiltering,
    meta: {},
  });

  // Totals
  const totalBudgeted = data.reduce((acc, row) => acc + row.budgeted, 0);
  const totalActivity = data.reduce((acc, row) => acc + row.activity, 0);
  const totalAvailable = data.reduce((acc, row) => acc + row.available, 0);

  return (
    <>
      <div className="py-4 lg:py-8">
        <div className="rounded-md border">
          <Table style={{ tableLayout: "fixed" }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
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
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center"
                  >
                    Uh ho no hay resultados aun...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="pl-6">Totales</TableCell>
                <TableCell className="pl-5">
                  {formatCurrency(totalBudgeted)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totalActivity)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totalAvailable)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </>
  );
}
