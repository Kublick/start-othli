import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/client";

export interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: "income" | "expense" | "transfer";
  currency: string;
  date: string;
  notes: string | null;
  userId: string | null;
  userAccountId: string | null;
  categoryId: number | null;
  sharedBudgetId: string | null;
  splitInfo: any | null;
  createdAt: string;
  updatedAt: string;
  payeeId: number | null;
  isTransfer: boolean;
  transferAccountId: string | null;
}

export interface TransactionFormData {
  description: string;
  amount: string;
  type: "income" | "expense" | "transfer";
  currency: string;
  date: string;
  notes?: string;
  userAccountId: string;
  categoryId?: number;
  payeeId?: number;
  isTransfer?: boolean;
  transferAccountId?: string;
}

export interface CreateTransactionData {
  transaction: TransactionFormData;
}

export interface UpdateTransactionData extends TransactionFormData {
  id: string;
}

export interface DeleteTransactionData {
  id: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: number;
  type?: "income" | "expense" | "transfer";
  search?: string;
}

// Query keys
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), { filters }] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

// Fetch transactions
const fetchTransactions = async (
  filters: TransactionFilters = {},
): Promise<Transaction[]> => {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.accountId) params.append("accountId", filters.accountId);
  if (filters.categoryId)
    params.append("categoryId", filters.categoryId.toString());
  if (filters.type) params.append("type", filters.type);
  if (filters.search) params.append("search", filters.search);

  const response = await client.api.transactions.$get({
    query: Object.fromEntries(params),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  const data = await response.json();
  return data.transactions || [];
};

// Create transaction
const createTransaction = async (
  data: CreateTransactionData,
): Promise<Transaction> => {
  const response = await client.api.transactions.$post({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to create transaction");
  }
  const result = await response.json();
  return result.transaction;
};

// Update transaction
const updateTransaction = async (
  data: UpdateTransactionData,
): Promise<Transaction> => {
  const response = await client.api.transactions.$put({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to update transaction");
  }
  const result = await response.json();
  return result.transaction;
};

// Delete transaction
const deleteTransaction = async (
  data: DeleteTransactionData,
): Promise<void> => {
  const response = await client.api.transactions.$delete({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to delete transaction");
  }
};

// Hooks
export const useTransactions = (filters: TransactionFilters = {}) => {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      toast.success("Transacción creada exitosamente");
    },
    onError: (error) => {
      console.error("Error creating transaction:", error);
      toast.error("Error al crear la transacción");
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      toast.success("Transacción actualizada exitosamente");
    },
    onError: (error) => {
      console.error("Error updating transaction:", error);
      toast.error("Error al actualizar la transacción");
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      toast.success("Transacción eliminada exitosamente");
    },
    onError: (error) => {
      console.error("Error deleting transaction:", error);
      toast.error("Error al eliminar la transacción");
    },
  });
};

// Utility hooks
export const useRecentTransactions = (limit = 10) => {
  const { data: transactions = [], ...rest } = useTransactions();
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
  return { data: recentTransactions, ...rest };
};

export const useTransactionsByType = (
  type: "income" | "expense" | "transfer",
) => {
  const { data: transactions = [], ...rest } = useTransactions({ type });
  return { data: transactions, ...rest };
};

export const useTransactionsByAccount = (accountId: string) => {
  const { data: transactions = [], ...rest } = useTransactions({ accountId });
  return { data: transactions, ...rest };
};

export const useTransactionsByCategory = (categoryId: number) => {
  const { data: transactions = [], ...rest } = useTransactions({ categoryId });
  return { data: transactions, ...rest };
};

// Transaction type mapping
export const transactionTypeLabels: Record<Transaction["type"], string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
};

export const transactionTypeColors: Record<Transaction["type"], string> = {
  income: "bg-green-100 text-green-800",
  expense: "bg-red-100 text-red-800",
  transfer: "bg-blue-100 text-blue-800",
};

export const transactionTypeIcons: Record<Transaction["type"], string> = {
  income: "↑",
  expense: "↓",
  transfer: "↔",
};

// Utility functions
export const formatAmount = (amount: string, currency = "USD") => {
  const numAmount = Number.parseFloat(amount);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date: string) => {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
