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
  splitInfo: Record<string, unknown> | null;
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

export interface TransactionHistoryDetails {
  description?: string;
  amount?: string;
  type?: "income" | "expense" | "transfer";
  date?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
}

export interface TransactionHistory {
  id: number;
  transactionId: string;
  userId: string;
  action: "created" | "updated" | "deleted";
  details: TransactionHistoryDetails | null;
  timestamp: string;
}

export interface TransactionHistoryResponse {
  history: TransactionHistory[];
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: number;
  type?: "income" | "expense" | "transfer";
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query keys
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), { filters }] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  history: () => [...transactionKeys.all, "history"] as const,
  historyDetail: (transactionId: string) =>
    [...transactionKeys.history(), transactionId] as const,
};

// Fetch transactions
const fetchTransactions = async (
  filters: TransactionFilters = {},
): Promise<TransactionResponse> => {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.accountId) params.append("accountId", filters.accountId);
  if (filters.categoryId)
    params.append("categoryId", filters.categoryId.toString());
  if (filters.type) params.append("type", filters.type);
  if (filters.search) params.append("search", filters.search);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await client.api.transactions.$get({
    query: Object.fromEntries(params),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  const data = await response.json();
  return {
    transactions: data.transactions || [],
    pagination: data.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  };
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

// Fetch transaction history
const fetchTransactionHistory = async (
  transactionId: string,
): Promise<TransactionHistoryResponse> => {
  const response = await client.api.transactions.history[":transactionId"].$get(
    {
      param: { transactionId },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transaction history");
  }
  const data = await response.json();
  const history = (data.history as TransactionHistory[]).map((item) => ({
    ...item,
    action: item.action as "created" | "updated" | "deleted",
  }));
  return {
    history: history || [],
  };
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });

      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: transactionKeys.historyDetail(data.id),
        });
      }
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

export const useTransactionHistory = (transactionId: string) => {
  return useQuery({
    queryKey: transactionKeys.historyDetail(transactionId),
    queryFn: () => fetchTransactionHistory(transactionId),
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Utility hooks
export const useRecentTransactions = (limit = 10) => {
  const { data, ...rest } = useTransactions();
  const transactions = data?.transactions || [];
  const recentTransactions = transactions
    .sort(
      (a: Transaction, b: Transaction) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    .slice(0, limit);
  return { data: recentTransactions, ...rest };
};

export const useTransactionsByType = (
  type: "income" | "expense" | "transfer",
) => {
  const { data, ...rest } = useTransactions({ type });
  const transactions = data?.transactions || [];
  return { data: transactions, ...rest };
};

export const useTransactionsByAccount = (accountId: string) => {
  const { data, ...rest } = useTransactions({ accountId });
  const transactions = data?.transactions || [];
  return { data: transactions, ...rest };
};

export const useTransactionsByCategory = (categoryId: number) => {
  const { data, ...rest } = useTransactions({ categoryId });
  const transactions = data?.transactions || [];
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
