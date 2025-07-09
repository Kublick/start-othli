import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/client";

export interface Category {
  id: number;
  name: string;
  description: string | null;
  isIncome: boolean;
  excludeFromBudget: boolean;
  excludeFromTotals: boolean;
  archived: boolean;
  archivedOn: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  isGroup: boolean;
  groupId: number | null;
  order: number;
  groupCategoryName: string | null;
  userId: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  isIncome: boolean;
  excludeFromBudget: boolean;
  excludeFromTotals: boolean;
}

export interface CreateCategoryData {
  categories: CategoryFormData[];
}

export interface UpdateCategoryData extends CategoryFormData {
  id: number;
  order: number;
}

export interface ArchiveCategoryData {
  id: number;
  archived: boolean;
  archivedOn: string | null;
}

export interface DeleteCategoryData {
  id: number;
}

export interface ReorderCategoriesData {
  updates: Array<{
    id: number;
    order: number;
    name?: string;
    description?: string;
    isIncome?: boolean;
    excludeFromBudget?: boolean;
    excludeFromTotals?: boolean;
  }>;
}

// Query keys
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (filters: string) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

// Fetch categories
const fetchCategories = async (): Promise<Category[]> => {
  const response = await client.api.categories.$get();
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  const data = await response.json();
  return (data.categories || []).sort(
    (a: Category, b: Category) => a.order - b.order,
  );
};

// Create categories
const createCategories = async (
  data: CreateCategoryData,
): Promise<Category[]> => {
  const response = await client.api.categories.$post({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to create categories");
  }
  const result = (await response.json()) as {
    success: boolean;
    message: string;
    categories?: Category[];
    category?: Category;
  };

  // Handle both single and bulk creation responses
  if (result.categories) {
    return result.categories;
  }
  if (result.category) {
    return [result.category];
  }

  return [];
};

// Update category
const updateCategory = async (data: UpdateCategoryData): Promise<void> => {
  const response = await client.api.categories.$put({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to update category");
  }
};

// Archive/unarchive category
const archiveCategory = async (data: ArchiveCategoryData): Promise<void> => {
  const response = await client.api.categories.$patch({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to update category");
  }
};

// Delete category
const deleteCategory = async (data: DeleteCategoryData): Promise<void> => {
  const response = await client.api.categories.$delete({
    json: data,
  });
  if (!response.ok) {
    throw new Error("Failed to delete category");
  }
};

// Reorder categories
const reorderCategories = async (
  data: ReorderCategoriesData,
): Promise<void> => {
  // Update all categories with new order
  const updatePromises = data.updates.map((update) => {
    return client.api.categories.$put({
      json: {
        id: update.id,
        name: update.name || "", // Will be filled by the server
        description: update.description || "",
        isIncome: update.isIncome || false,
        excludeFromBudget: update.excludeFromBudget || false,
        excludeFromTotals: update.excludeFromTotals || false,
        order: update.order,
      },
    });
  });

  const responses = await Promise.all(updatePromises);
  const hasError = responses.some((response) => !response.ok);

  if (hasError) {
    throw new Error("Failed to reorder categories");
  }
};

// Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategories,
    onSuccess: (createdCategories) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success("Categorías creadas exitosamente");
      return createdCategories;
    },
    onError: (error) => {
      console.error("Error creating categories:", error);
      toast.error("Error al crear las categorías");
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success("Categoría actualizada exitosamente");
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast.error("Error al actualizar la categoría");
    },
  });
};

export const useArchiveCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveCategory,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success(
        variables.archived
          ? "Categoría archivada exitosamente"
          : "Categoría restaurada exitosamente",
      );
    },
    onError: (error) => {
      console.error("Error archiving category:", error);
      toast.error("Error al actualizar la categoría");
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success("Categoría eliminada exitosamente");
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar la categoría");
    },
  });
};

export const useReorderCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderCategories,
    onMutate: async ({ updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: categoryKeys.lists() });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData(categoryKeys.lists());

      // Optimistically update to the new value
      queryClient.setQueryData(
        categoryKeys.lists(),
        (old: Category[] | undefined) => {
          if (!old) return old;

          // Create a map of the updates for quick lookup
          const updateMap = new Map(
            updates.map((update) => [update.id, update.order]),
          );

          // Apply the order updates and sort by the new order
          return old
            .map((category) => {
              const newOrder = updateMap.get(category.id);
              if (newOrder !== undefined) {
                return {
                  ...category,
                  order: newOrder,
                };
              }
              return category;
            })
            .sort((a, b) => a.order - b.order);
        },
      );

      // Return a context object with the snapshotted value
      return { previousCategories };
    },
    onError: (err, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCategories) {
        queryClient.setQueryData(
          categoryKeys.lists(),
          context.previousCategories,
        );
      }
      console.error("Error reordering categories:", err);
      toast.error("Error al actualizar el orden de las categorías");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Orden de categorías actualizado");
    },
  });
};

// Utility hooks
export const useActiveCategories = () => {
  const { data: categories = [], ...rest } = useCategories();
  const activeCategories = categories.filter((cat) => !cat.archived);
  return { data: activeCategories, ...rest };
};

export const useArchivedCategories = () => {
  const { data: categories = [], ...rest } = useCategories();
  const archivedCategories = categories.filter((cat) => cat.archived);
  return { data: archivedCategories, ...rest };
};

export { fetchCategories };
