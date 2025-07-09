import { createFileRoute } from "@tanstack/react-router";
import { fetchCategories } from "@/features/dashboard/api/categories";
import { fetchTransactions } from "@/features/dashboard/api/transactions";
import AnalisisComponent from "@/features/dashboard/components/analisis-component";
import { queryClient } from "@/integrations/tanstack-query/root-provider";

function getLastSixMonths() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months;
}

export const Route = createFileRoute("/dashboard/analisis")({
  async loader() {
    const months = getLastSixMonths();
    const start = `${months[0].year}-${String(months[0].month).padStart(2, "0")}-01`;
    const endDate = new Date(months[5].year, months[5].month, 0);
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    // Prefetch categories
    await queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: fetchCategories,
    });
    // Prefetch transactions for the 6 month range
    await queryClient.prefetchQuery({
      queryKey: ["transactions", { startDate: start, endDate: end }],
      queryFn: () => fetchTransactions({ startDate: start, endDate: end }),
    });
    return { months };
  },
  component: RouteComponent,
});

function RouteComponent() {
  // The months array is available as loader data
  return (
    <div>
      <AnalisisComponent />
    </div>
  );
}
