import type { UseMutationResult } from "@tanstack/react-query";

import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";

const CategoryCell = ({
  transaction,
  categories,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  categories: { id: number; name: string }[];
  createCategory: (name: string) => Promise<void>;
  refetchCategories: () => Promise<{ data?: { id: number; name: string }[] }>;
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) => {
  const handleChange = async (newValue: string) => {
    if (newValue === transaction.categoryId?.toString()) return;
    try {
      await updateTransactionMutation.mutateAsync({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        currency: transaction.currency,
        date: transaction.date,
        notes: transaction.notes ?? undefined,
        userAccountId: transaction.userAccountId || "",
        categoryId: newValue ? Number.parseInt(newValue, 10) : undefined,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  return (
    <select
      className="w-full rounded border px-2 py-1 text-sm"
      value={transaction.categoryId?.toString() || ""}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="">Sin categoría</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategoryCell;
