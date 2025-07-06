import type { UseMutationResult } from "@tanstack/react-query";

import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";

const AccountCell = ({
  transaction,
  accounts,
  updateTransactionMutation,
}: {
  transaction: Transaction;
  accounts: { id: string; name: string }[];
  updateTransactionMutation: UseMutationResult<
    Transaction,
    Error,
    UpdateTransactionData,
    unknown
  >;
}) => {
  const handleChange = async (newValue: string) => {
    if (newValue === transaction.userAccountId) return;
    try {
      await updateTransactionMutation.mutateAsync({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        currency: transaction.currency,
        date: transaction.date,
        notes: transaction.notes ?? undefined,
        userAccountId: newValue,
        categoryId: transaction.categoryId ?? undefined,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  return (
    <select
      className="w-full rounded border px-2 py-1 text-sm"
      value={transaction.userAccountId || ""}
      onChange={(e) => handleChange(e.target.value)}
    >
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
};

export default AccountCell;
