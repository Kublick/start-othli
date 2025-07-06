import type { Table } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import type { Transaction } from "@/features/dashboard/api/transactions";
export function SortableHeader({
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

export const TableContext = React.createContext<Table<Transaction> | null>(
  null,
);
export function useReactTableContext() {
  const ctx = React.useContext(TableContext);
  if (!ctx) throw new Error("SortableHeader must be used within TableContext");
  return ctx;
}
