import { useQuery } from "@tanstack/react-query";

export interface SummaryCategory {
  id: number;
  name: string;
  amount: number;
  type: "income" | "expense";
  percent: number;
}

export interface SummaryAccount {
  id: number;
  name: string;
  type: string;
  balance: number;
}

export interface SummaryData {
  dateRange: { start: string; end: string };
  accounts: SummaryAccount[];
  netWorth: number;
  income: number;
  expenses: number;
  netIncome: number;
  savingsRate: number;
  categories: SummaryCategory[];
}

export function useSummary({ start, end }: { start: string; end: string }) {
  return useQuery<SummaryData>({
    queryKey: ["summary", start, end],
    queryFn: async () => {
      const params = new URLSearchParams({ start, end });
      const res = await fetch(`/api/summary?${params}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    enabled: !!start && !!end,
  });
}
