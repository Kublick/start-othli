import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface AmountInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: string | number;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

function BudgetInput({
  className,
  value: controlledValue,
  onChange,
  onBlur,
  ...props
}: AmountInputProps) {
  const [internalValue, setInternalValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  // Sync controlled value
  React.useEffect(() => {
    if (controlledValue !== undefined) {
      const valueStr = String(controlledValue);
      const numericValue = Number.parseFloat(valueStr);

      if (Number(numericValue) && numericValue !== 0) {
        setInternalValue(Math.abs(numericValue).toString());
      } else {
        setInternalValue(numericValue === 0 ? "0" : "");
      }
    } else {
      setInternalValue("");
    }
  }, [controlledValue]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const sanitizedValue = rawValue
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");
    setInternalValue(sanitizedValue);

    if (onChange) {
      onChange(sanitizedValue);
    }
  };

  const handleInputFocus = () => setIsFocused(true);

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  // Currency formatting utility
  const formatCurrency = (
    value: number | null | undefined,
    placeholder = "MX$0.00",
  ) => {
    if (value === null || value === undefined || Number.isNaN(value))
      return placeholder;
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div
      className={cn(
        "hover:primary flex items-center gap-1 hover:border-2",
        className,
      )}
    >
      <Input
        type="text"
        value={
          isFocused
            ? internalValue
            : internalValue !== ""
              ? formatCurrency(Number(internalValue))
              : ""
        }
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className={cn("tabular-nums", {
          "border-transparent bg-transparent shadow-none": !isFocused,
        })}
        {...props}
      />
    </div>
  );
}

export { BudgetInput };
