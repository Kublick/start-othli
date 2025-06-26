import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/client";

export interface Payee {
  id: number;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Fetch payees
const fetchPayees = async (): Promise<Payee[]> => {
  const response = await client.api.payees.$get();
  if (!response.ok) {
    throw new Error("Failed to fetch payees");
  }
  const data = await response.json();
  return data.payees || [];
};

export const usePayees = () => {
  return useQuery({
    queryKey: ["payees"],
    queryFn: fetchPayees,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Create payee
const createPayee = async (name: string): Promise<Payee> => {
  const response = await client.api.payees.$post({
    json: { name },
  });
  if (!response.ok) {
    throw new Error("Failed to create payee");
  }
  const data = await response.json();
  return data.payee;
};

export const useCreatePayee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payees"] });
      toast.success("Beneficiario creado exitosamente");
    },
    onError: (error) => {
      console.error("Error creating payee:", error);
      toast.error("Error al crear el beneficiario");
    },
  });
};
