import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/client";

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: string; // Keep as string to match existing transaction pattern
  currency: string;
  frequency: string;
  startDate: string; // Keep as string for API consistency
  endDate: string | null;
  isActive: boolean;
  userId: string | null;
  userAccountId: string | null;
  categoryId: number | null;
  payeeId: number | null;
  // Add missing fields from schema
  sharedBudgetId: string | null;
  splitInfo: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransactionFormData {
  description: string;
  amount: string; // Keep as string
  currency: string;
  frequency: string;
  billingDate: string;
  startDate: string; // Keep as string
  endDate?: string; // Keep as string
  userAccountId: string;
  categoryId?: number;
  payeeId?: number;
  // Add optional fields from schema
  sharedBudgetId?: string;
  splitInfo?: Record<string, unknown>;
}

export interface CreateRecurringTransactionData {
  recurringTransaction: RecurringTransactionFormData;
}

export interface UpdateRecurringTransactionData
  extends RecurringTransactionFormData {
  id: string;
  isActive?: boolean;
}

export interface DeleteRecurringTransactionData {
  id: string;
}

export interface RecurringTransactionResponse {
  recurringTransactions: RecurringTransaction[];
}

// Query keys
export const recurringTransactionKeys = {
  all: ["recurringTransactions"] as const,
  lists: () => [...recurringTransactionKeys.all, "list"] as const,
  details: () => [...recurringTransactionKeys.all, "detail"] as const,
  detail: (id: string) => [...recurringTransactionKeys.details(), id] as const,
};

// Fetch recurring transactions
const fetchRecurringTransactions =
  async (): Promise<RecurringTransactionResponse> => {
    const response = await client.api["recurring-transactions"].$get();

    if (!response.ok) {
      throw new Error("Failed to fetch recurring transactions");
    }
    const data = await response.json();
    return {
      recurringTransactions: data.recurringTransactions || [],
    };
  };

// Create recurring transaction
const createRecurringTransaction = async (
  data: RecurringTransactionFormData,
): Promise<RecurringTransaction> => {
  const response = await client.api["recurring-transactions"].$post({
    json: {
      ...data,
      type: "debito",
      frequency: data.frequency as
        | "weekly"
        | "monthly"
        | "quarterly"
        | "yearly",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to create recurring transaction");
  }
  const result = await response.json();
  return result.recurringTransaction;
};

// Update recurring transaction
const updateRecurringTransaction = async (
  data: UpdateRecurringTransactionData,
): Promise<RecurringTransaction> => {
  const response = await client.api["recurring-transactions"].$put({
    json: {
      ...data,
      type: "credito",
      frequency: data.frequency as
        | "weekly"
        | "monthly"
        | "quarterly"
        | "yearly",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to update recurring transaction");
  }
  const result = await response.json();
  return result.recurringTransaction;
};

// Delete recurring transaction
const deleteRecurringTransaction = async (
  data: DeleteRecurringTransactionData,
): Promise<void> => {
  const response = await client.api["recurring-transactions"].$delete({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to delete recurring transaction");
  }
};

// React Query hooks
export const useRecurringTransactions = () => {
  return useQuery({
    queryKey: recurringTransactionKeys.lists(),
    queryFn: fetchRecurringTransactions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all });
      toast.success("Recurring transaction created successfully");
    },
    onError: (error) => {
      console.error("Error creating recurring transaction:", error);
      toast.error("Failed to create recurring transaction");
    },
  });
};

export const useUpdateRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all });
      toast.success("Recurring transaction updated successfully");
    },
    onError: (error) => {
      console.error("Error updating recurring transaction:", error);
      toast.error("Failed to update recurring transaction");
    },
  });
};

export const useDeleteRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all });
      toast.success("Recurring transaction deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting recurring transaction:", error);
      toast.error("Failed to delete recurring transaction");
    },
  });
};
