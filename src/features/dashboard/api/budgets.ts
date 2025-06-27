import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/client";

export interface BudgetData {
  budgets: Record<number, number>; // categoryId -> plannedAmount
}

export interface UpdateBudgetData {
  categoryId: number;
  amount: number;
}

// Query keys
export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  list: (filters: string) => [...budgetKeys.lists(), { filters }] as const,
  details: () => [...budgetKeys.all, "detail"] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
};

// Fetch budgets
const fetchBudgets = async (): Promise<BudgetData> => {
  const response = await client.api.budgets.$get();
  if (!response.ok) {
    throw new Error("Failed to fetch budgets");
  }
  const data = await response.json();
  return data;
};

// Create/Update budget
const updateBudget = async (data: UpdateBudgetData): Promise<void> => {
  const response = await client.api.budgets.$post({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to update budget");
  }
};

// Update budget (PUT method)
const updateBudgetPut = async (data: UpdateBudgetData): Promise<void> => {
  const response = await client.api.budgets.$put({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to update budget");
  }
};

// Hooks
export const useBudgets = () => {
  return useQuery({
    queryKey: budgetKeys.lists(),
    queryFn: fetchBudgets,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      toast.success("Presupuesto actualizado exitosamente");
    },
    onError: (error) => {
      console.error("Error updating budget:", error);
      toast.error("Error al actualizar el presupuesto");
    },
  });
};

export const useUpdateBudgetPut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBudgetPut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      toast.success("Presupuesto actualizado exitosamente");
    },
    onError: (error) => {
      console.error("Error updating budget:", error);
      toast.error("Error al actualizar el presupuesto");
    },
  });
};
