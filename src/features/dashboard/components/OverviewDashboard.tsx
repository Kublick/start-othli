import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  type SummaryAccount,
  type SummaryCategory,
  type SummaryData,
  useSummary,
} from "../api/summary";

interface OverviewDashboardProps {
  userName?: string;
}

export function OverviewDashboard({
  userName = "Usuario",
}: OverviewDashboardProps) {
  // Date range state (colocated)
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
    };
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Move range to previous/next full month
  const moveMonth = (direction: -1 | 1) => {
    setDateRange((prev) => {
      const newFrom = startOfMonth(addMonths(prev.from, direction));
      const newTo = endOfMonth(addMonths(prev.from, direction));
      return { from: newFrom, to: newTo };
    });
  };

  // Format range label in Spanish
  const formatRangeLabel = (from: Date, to: Date) => {
    const opts = { month: "short", day: "numeric", year: "numeric" } as const;
    return `${from.toLocaleDateString("es-MX", opts)} a ${to.toLocaleDateString("es-MX", opts)}`;
  };

  // Fetch summary data for the current range
  const {
    data: summary,
    isLoading,
    error,
  } = useSummary({
    start: dateRange.from.toISOString().split("T")[0],
    end: dateRange.to.toISOString().split("T")[0],
  });

  // Spanish labels for account types
  const accountTypeLabels: Record<string, string> = {
    efectivo: "Efectivo",
    debito: "Débito",
    credito: "Crédito",
    inversion: "Inversión",
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-8 font-bold text-4xl">¡Bienvenido {userName}!</h1>
      <div className="flex flex-col gap-6">
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="rounded border px-2 py-1 font-bold text-lg hover:bg-muted"
          >
            &#60;
          </button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded border bg-background px-4 py-2 font-medium"
                onClick={() => setCalendarOpen(true)}
              >
                {formatRangeLabel(dateRange.from, dateRange.to)}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="rounded border px-2 py-1 font-bold text-lg hover:bg-muted"
          >
            &#62;
          </button>
        </div>

        {/* Loading/Error States */}
        {isLoading ? (
          <div className="rounded-lg border bg-card p-8">
            <Skeleton className="mb-4 h-8 w-1/2" />
            <Skeleton className="mb-2 h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : error ? (
          <div className="rounded-lg border bg-card p-8 text-red-600">
            Error al cargar el resumen financiero.
          </div>
        ) : summary ? (
          <DashboardContent
            summary={summary}
            accountTypeLabels={accountTypeLabels}
          />
        ) : null}
      </div>
    </div>
  );
}

function DashboardContent({
  summary,
  accountTypeLabels,
}: {
  summary: SummaryData;
  accountTypeLabels: Record<string, string>;
}) {
  // Group accounts by type
  const groupedAccounts = summary.accounts.reduce<
    Record<string, SummaryAccount[]>
  >((acc, account) => {
    acc[account.type] = acc[account.type] || [];
    acc[account.type].push(account);
    return acc;
  }, {});

  // Category breakdown
  const incomeCategories = summary.categories.filter(
    (c: SummaryCategory) => c.type === "income",
  );
  const expenseCategories = summary.categories.filter(
    (c: SummaryCategory) => c.type === "expense",
  );
  const totalIncome = summary.income;
  const totalExpenses = summary.expenses;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Left Column */}
      <div className="flex flex-col gap-6">
        {/* Accounts Overview */}
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">
                RESUMEN DE CUENTAS
              </span>
              <span
                className="text-muted-foreground text-xs"
                title="Saldos de cuentas al final del periodo"
              >
                &#9432;
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(groupedAccounts).map(([type, group]) => (
                <div key={type}>
                  <div className="mb-1 font-medium text-muted-foreground text-sm">
                    {accountTypeLabels[type] || type} ({group.length})
                  </div>
                  <div className="ml-2">
                    {group.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="cursor-pointer text-primary underline">
                          {account.name}
                        </span>
                        <span>
                          {account.balance.toLocaleString("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold text-sm">
              <span>Patrimonio Neto Estimado</span>
              <span
                className={cn(
                  summary.netWorth < 0 ? "text-red-600" : "text-green-600",
                )}
              >
                {summary.netWorth.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Period Summary */}
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="mb-2 font-semibold text-muted-foreground">
              RESUMEN DEL PERIODO
            </div>
            <div className="mb-2">
              <div className="font-semibold text-muted-foreground text-xs">
                INGRESOS
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Ingresos Totales</span>
                <span className="font-bold text-green-600">
                  {totalIncome.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </span>
              </div>
            </div>
            <div className="mb-2">
              <div className="font-semibold text-muted-foreground text-xs">
                GASTOS
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Gastos Totales</span>
                <span className="font-bold text-red-600">
                  -
                  {Math.abs(totalExpenses).toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </span>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">
                Ingreso Neto{" "}
                <span
                  className="text-muted-foreground text-xs"
                  title="Ingresos menos gastos"
                >
                  &#9432;
                </span>
              </span>
              <span
                className={cn(
                  summary.netIncome < 0 ? "text-red-600" : "text-green-600",
                  "font-bold",
                )}
              >
                {summary.netIncome < 0 ? "-" : ""}
                {Math.abs(summary.netIncome).toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Tasa de Ahorro Actual{" "}
                <span
                  className="text-muted-foreground text-xs"
                  title="Ingreso neto / ingresos"
                >
                  &#9432;
                </span>
              </span>
              <span className="font-bold text-green-600">
                {(summary.savingsRate * 100).toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div>
        <Card>
          <CardContent className="pt-4 pb-2">
            <div className="mb-2 font-semibold text-muted-foreground">
              DESGLOSE DE GASTOS
            </div>
            {/* Income/Expense Progress Bars */}
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-center justify-between font-semibold text-xs">
                <span>
                  INGRESOS{" "}
                  <span
                    title="Ingresos totales del periodo"
                    className="text-muted-foreground"
                  >
                    &#9432;
                  </span>
                </span>
                <span className="text-green-600">
                  {totalIncome.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </span>
              </div>
              <Progress value={100} className="h-3 bg-green-100" />
              <div className="mt-2 flex items-center justify-between font-semibold text-xs">
                <span>
                  GASTOS{" "}
                  <span
                    title="Gastos totales del periodo"
                    className="text-muted-foreground"
                  >
                    &#9432;
                  </span>
                </span>
                <span className="text-red-600">
                  -
                  {Math.abs(totalExpenses).toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </span>
              </div>
              <Progress
                value={(Math.abs(totalExpenses) / (totalIncome || 1)) * 100}
                className="h-3 bg-red-100"
              />
            </div>

            {/* Category Breakdown */}
            <div className="mb-2">
              <div className="mb-1 font-semibold text-muted-foreground text-xs">
                INGRESOS
              </div>
              {incomeCategories.map((cat) => (
                <div key={cat.id} className="mb-1 flex items-center gap-2">
                  <span className="w-32 truncate text-green-700 text-sm">
                    {cat.name}
                  </span>
                  <Progress
                    value={cat.percent * 100}
                    className="flex-1 bg-green-100"
                  />
                  <span className="w-24 text-right font-medium text-green-700">
                    {cat.amount.toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </span>
                  <span className="w-10 text-muted-foreground text-xs">
                    {Math.round(cat.percent * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mb-2">
              <div className="mb-1 font-semibold text-muted-foreground text-xs">
                GASTOS
              </div>
              {expenseCategories.map((cat, idx) => (
                <div key={cat.id} className="mb-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "w-32 truncate text-sm",
                      idx === 1 ? "text-yellow-600" : "text-red-700",
                    )}
                  >
                    {cat.name}
                  </span>
                  <Progress
                    value={cat.percent * 100}
                    className={cn(
                      "flex-1",
                      idx === 1 ? "bg-yellow-100" : "bg-red-100",
                    )}
                  />
                  <span
                    className={cn(
                      "w-24 text-right font-medium",
                      idx === 1 ? "text-yellow-600" : "text-red-700",
                    )}
                  >
                    -
                    {Math.abs(cat.amount).toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </span>
                  <span className="w-10 text-muted-foreground text-xs">
                    {Math.round(cat.percent * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
