import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/client";

export interface Account {
  id: string;
  name: string;
  type: "efectivo" | "debito" | "credito" | "inversion";
  balance: string;
  currency: string;
  isActive: boolean;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  subtypeName: string | null;
  displayName: string | null;
  balanceAsOf: string | Date;
  closedOn: string | Date | null;
  institutionName: string | null;
  excludeTransactions: boolean;
}

export interface AccountFormData {
  name: string;
  type: "efectivo" | "debito" | "credito" | "inversion";
  balance: string;
  currency: string;
  institutionName?: string;
  excludeTransactions: boolean;
}

export interface CreateAccountData {
  accounts: AccountFormData[];
}

export interface UpdateAccountData extends AccountFormData {
  id: string;
}

export interface DeleteAccountData {
  id: string;
}

export interface CloseAccountData {
  id: string;
  closedOn: string | null;
}

// Query keys
export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: (filters: string) => [...accountKeys.lists(), { filters }] as const,
  details: () => [...accountKeys.all, "detail"] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
};

// Fetch accounts
const fetchAccounts = async (): Promise<Account[]> => {
  const response = await client.api["financial-accounts"].$get();
  if (!response.ok) {
    throw new Error("Failed to fetch accounts");
  }
  const data = await response.json();
  return data.userAccounts || [];
};

// Create accounts
const createAccounts = async (data: CreateAccountData): Promise<void> => {
  const response = await client.api["financial-accounts"].$post({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to create accounts");
  }
};

// Update account
const updateAccount = async (data: UpdateAccountData): Promise<void> => {
  const response = await client.api["financial-accounts"].$put({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to update account");
  }
};

// Delete account
const deleteAccount = async (data: DeleteAccountData): Promise<void> => {
  const response = await client.api["financial-accounts"].$delete({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to delete account");
  }
};

// Close account
const closeAccount = async (data: CloseAccountData): Promise<void> => {
  const response = await client.api["financial-accounts"].$patch({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to update account");
  }
};

// Hooks
export const useAccounts = () => {
  return useQuery({
    queryKey: accountKeys.lists(),
    queryFn: fetchAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateAccounts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccounts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Cuentas creadas exitosamente");
    },
    onError: (error) => {
      console.error("Error creating accounts:", error);
      toast.error("Error al crear las cuentas");
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Cuenta actualizada exitosamente");
    },
    onError: (error) => {
      console.error("Error updating account:", error);
      toast.error("Error al actualizar la cuenta");
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success("Cuenta eliminada exitosamente");
    },
    onError: (error) => {
      console.error("Error deleting account:", error);
      toast.error("Error al eliminar la cuenta");
    },
  });
};

export const useCloseAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeAccount,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      toast.success(
        variables.closedOn
          ? "Cuenta cerrada exitosamente"
          : "Cuenta reabierta exitosamente",
      );
    },
    onError: (error) => {
      console.error("Error closing account:", error);
      toast.error("Error al actualizar la cuenta");
    },
  });
};

// Utility hooks
export const useActiveAccounts = () => {
  const { data: accounts = [], ...rest } = useAccounts();
  const activeAccounts = accounts.filter(
    (acc: Account) => acc.isActive && !acc.closedOn,
  );
  return { data: activeAccounts, ...rest };
};

export const useClosedAccounts = () => {
  const { data: accounts = [], ...rest } = useAccounts();
  const closedAccounts = accounts.filter((acc: Account) => acc.closedOn);
  return { data: closedAccounts, ...rest };
};

// Account type mapping
export const accountTypeLabels: Record<Account["type"], string> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  inversion: "Inversión",
};

export const accountTypeColors: Record<Account["type"], string> = {
  efectivo: "bg-green-100 text-green-800",
  debito: "bg-blue-100 text-blue-800",
  credito: "bg-purple-100 text-purple-800",
  inversion: "bg-orange-100 text-orange-800",
};
