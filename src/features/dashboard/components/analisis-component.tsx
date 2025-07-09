import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveCategories } from "@/features/dashboard/api/categories";
import { useTransactions } from "@/features/dashboard/api/transactions";

function getLastSixMonths() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("es-MX", { month: "short", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months;
}

export default function AnalisisComponent() {
  const months = getLastSixMonths();
  const { data: categories = [] } = useActiveCategories();

  // Sorting state for category name
  const [sortAsc, setSortAsc] = useState(true);

  // Fetch all transactions for the 6 month range
  const start = `${months[0].year}-${String(months[0].month).padStart(2, "0")}-01`;
  const endDate = new Date(months[5].year, months[5].month, 0); // last day of last month
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  const { data } = useTransactions({ startDate: start, endDate: end });
  const transactions = data?.transactions || [];

  // Build category/month matrix
  const categoryRows = useMemo(
    () =>
      categories.map((cat) => {
        const monthData = months.map((m) => {
          const sum = transactions
            .filter(
              (tx) =>
                tx.categoryId === cat.id &&
                new Date(tx.date).getFullYear() === m.year &&
                new Date(tx.date).getMonth() + 1 === m.month,
            )
            .reduce((acc, tx) => acc + Number(tx.amount), 0);
          return sum;
        });
        const total = monthData.reduce((a, b) => a + b, 0);
        const count = transactions.filter(
          (tx) => tx.categoryId === cat.id,
        ).length;
        const avg = count > 0 ? total / count : 0;
        return {
          category: cat.name,
          monthData,
          total,
          avg,
          count,
        };
      }),
    [categories, months, transactions],
  );

  // Sort categoryRows by category name
  const sortedCategoryRows = useMemo(() => {
    return [...categoryRows].sort((a, b) =>
      sortAsc
        ? a.category.localeCompare(b.category)
        : b.category.localeCompare(a.category),
    );
  }, [categoryRows, sortAsc]);

  // Calculate monthly totals, overall total, and overall average
  const monthlyTotals = useMemo(() => {
    const totals: number[] = Array(months.length).fill(0);
    sortedCategoryRows.forEach((row) => {
      row.monthData.forEach((val, i) => {
        totals[i] += val;
      });
    });
    return totals;
  }, [sortedCategoryRows, months.length]);

  const overallTotal = useMemo(() => {
    return sortedCategoryRows.reduce((sum, row) => sum + row.total, 0);
  }, [sortedCategoryRows]);

  const overallAvg = useMemo(() => {
    if (sortedCategoryRows.length === 0) return 0;
    return (
      sortedCategoryRows.reduce((sum, row) => sum + row.avg, 0) /
      sortedCategoryRows.length
    );
  }, [sortedCategoryRows]);

  // Calculate monthly averages for the average row (only among categories with a non-zero value for that month)
  const monthlyAverages = useMemo(() => {
    if (sortedCategoryRows.length === 0) return Array(months.length).fill(0);
    return months.map((_, i) => {
      let sum = 0;
      let count = 0;
      sortedCategoryRows.forEach((row) => {
        const val = row.monthData[i];
        if (val !== 0) {
          sum += val;
          count++;
        }
      });
      return count > 0 ? sum / count : 0;
    });
  }, [sortedCategoryRows, months.length, months.map]);

  // Overall total average: only among categories with a non-zero total
  const overallTotalAvg = useMemo(() => {
    const nonZeroTotals = sortedCategoryRows
      .map((row) => row.total)
      .filter((val) => val !== 0);
    if (nonZeroTotals.length === 0) return 0;
    return (
      nonZeroTotals.reduce((sum, val) => sum + val, 0) / nonZeroTotals.length
    );
  }, [sortedCategoryRows]);

  // Overall average of averages: only among categories with a non-zero avg
  const overallAvgAvg = useMemo(() => {
    const nonZeroAvgs = sortedCategoryRows
      .map((row) => row.avg)
      .filter((val) => val !== 0);
    if (nonZeroAvgs.length === 0) return 0;
    return nonZeroAvgs.reduce((sum, val) => sum + val, 0) / nonZeroAvgs.length;
  }, [sortedCategoryRows]);

  const currencyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });

  console.log(categoryRows);

  return (
    <DashboardLayout title="Análisis">
      <div className="overflow-x-auto">
        <Table className="min-w-full border text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="border px-2 py-1 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1 font-semibold hover:text-primary"
                  onClick={() => setSortAsc((asc) => !asc)}
                  title="Ordenar por categoría"
                >
                  Categoría
                  {sortAsc ? (
                    <span>
                      <ChevronUp className="h-4 w-4" />
                    </span>
                  ) : (
                    <span>
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </TableHead>
              {months.map((m) => (
                <TableHead key={m.key} className="border px-2 py-1 text-center">
                  {m.label}
                </TableHead>
              ))}
              <TableHead className="border px-2 py-1 text-center">
                Total
              </TableHead>
              <TableHead className="border px-2 py-1 text-center">
                Promedio
              </TableHead>
              <TableHead className="border px-2 py-1 text-center">
                Registros
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCategoryRows.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="border px-2 py-1">
                  {row.category}
                </TableCell>
                {row.monthData.map((val, i) => (
                  <TableCell
                    key={months[i].key}
                    className="border px-2 py-1 text-right"
                  >
                    {val !== 0 ? currencyFormatter.format(val) : "-"}
                  </TableCell>
                ))}
                <TableCell className="border px-2 py-1 text-right">
                  {currencyFormatter.format(row.total)}
                </TableCell>
                <TableCell className="border px-2 py-1 text-right">
                  {currencyFormatter.format(row.avg)}
                </TableCell>
                <TableCell className="border px-2 py-1 text-center">
                  {row.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="border px-2 py-1 text-right font-semibold">
                Promedio
              </TableCell>
              {monthlyAverages.map((val, i) => (
                <TableCell
                  key={months[i].key}
                  className="border px-2 py-1 text-right font-semibold"
                >
                  {val !== 0 ? currencyFormatter.format(val) : "-"}
                </TableCell>
              ))}
              <TableCell className="border px-2 py-1 text-right font-semibold">
                {currencyFormatter.format(overallTotalAvg)}
              </TableCell>
              <TableCell className="border px-2 py-1 text-right font-semibold">
                {currencyFormatter.format(overallAvgAvg)}
              </TableCell>
              <TableCell className="border px-2 py-1" />
            </TableRow>
            <TableRow>
              <TableCell className="border px-2 py-1 text-right font-semibold">
                Resultado
              </TableCell>
              {monthlyTotals.map((val, i) => (
                <TableCell
                  key={months[i].key}
                  className="border px-2 py-1 text-right font-semibold"
                >
                  {val !== 0 ? currencyFormatter.format(val) : "-"}
                </TableCell>
              ))}
              <TableCell className="border px-2 py-1 text-right font-semibold">
                {currencyFormatter.format(overallTotal)}
              </TableCell>
              <TableCell className="border px-2 py-1 text-right font-semibold">
                {currencyFormatter.format(overallAvg)}
              </TableCell>
              <TableCell className="border px-2 py-1" />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </DashboardLayout>
  );
}
