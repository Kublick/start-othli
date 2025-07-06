import type React from "react";
import { useState } from "react";
import type {
  Transaction,
  UpdateTransactionData,
} from "@/features/dashboard/api/transactions";

const EditableDescription = ({
  transaction,
  onUpdate,
}: {
  transaction: Transaction;
  onUpdate: (data: UpdateTransactionData) => void;
}) => {
  const [value, setValue] = useState(transaction.description);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== transaction.description) {
      onUpdate({
        ...transaction,
        description: value,
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
      setValue(transaction.description);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        className="w-full rounded border px-2 py-1 text-sm"
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
      className="w-full cursor-pointer rounded p-1 text-left hover:bg-muted/50"
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {value || "Sin descripción"}
    </button>
  );
};

export default EditableDescription;
