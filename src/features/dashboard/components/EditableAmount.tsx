import type React from "react";
import { useState } from "react";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";

const EditableAmount = ({
  transaction,
  onUpdate,
}: {
  transaction: Transaction;
  onUpdate: (data: UpdateTransactionData) => void;
}) => {
  const [value, setValue] = useState(transaction.amount);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== transaction.amount) {
      onUpdate({
        ...transaction,
        amount: value,
        notes: transaction.notes ?? undefined,
        userAccountId: transaction.userAccountId || "",
        categoryId: transaction.categoryId ?? undefined,
        payeeId: transaction.payeeId ?? undefined,
        transferAccountId: transaction.transferAccountId ?? undefined,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setValue(transaction.amount);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        className="w-full rounded border px-2 py-1 text-right text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <button
      type="button"
      className="w-full cursor-pointer rounded p-1 text-right hover:bg-muted/50"
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {Number(value).toLocaleString("es-MX", {
        style: "currency",
        currency: transaction.currency || "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </button>
  );
};

export default EditableAmount;
