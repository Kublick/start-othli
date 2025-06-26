import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Payee } from "@/features/dashboard/api/payees";
import { cn } from "@/lib/utils";

export interface PayeeComboboxProps {
  value?: number;
  onChange?: (payeeId: number | undefined) => void;
  payees: Payee[];
  onCreatePayee: (name: string) => Promise<void>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  createMessage?: string;
  allowCreate?: boolean;
  clearable?: boolean;
  disableClear?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  className?: string;
}

export const PayeeCombobox = React.forwardRef<
  HTMLButtonElement,
  PayeeComboboxProps
>(
  (
    {
      value,
      onChange,
      payees,
      onCreatePayee,
      placeholder = "Selecciona un beneficiario",
      searchPlaceholder = "Buscar beneficiario",
      emptyMessage = "No se encontraron beneficiarios",
      createMessage = "Crear beneficiario",
      allowCreate = true,
      clearable = true,
      disableClear = false,
      disabled = false,
      loading = false,
      error = false,
      className,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    const selectedPayee = React.useMemo(
      () => payees.find((p) => p.id === value),
      [payees, value],
    );

    const filteredPayees = React.useMemo(() => {
      if (!searchQuery) return payees;
      return payees.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }, [payees, searchQuery]);

    const exactMatch = React.useMemo(() => {
      return payees.some(
        (p) => p.name.toLowerCase() === searchQuery.toLowerCase(),
      );
    }, [payees, searchQuery]);

    const handleSelect = (currentValue: string) => {
      const payeeId = Number.parseInt(currentValue, 10);
      const newValue = payeeId === value ? undefined : payeeId;
      onChange?.(newValue);
      setOpen(false);
    };

    const handleCreate = async () => {
      if (!searchQuery.trim()) return;
      await onCreatePayee(searchQuery.trim());
      setOpen(false);
    };

    const handleClear = () => {
      onChange?.(undefined);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && searchQuery && !exactMatch && allowCreate) {
        e.preventDefault();
        handleCreate();
      }
    };

    if (loading) {
      return (
        <Button
          ref={ref}
          variant="outline"
          className={cn("w-full justify-between", className)}
          disabled
        >
          <span className="text-muted-foreground">Cargando...</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Button
              ref={ref}
              variant="outline"
              aria-expanded={open}
              className={cn(
                "w-full justify-between pr-8 font-normal",
                error ? "border-destructive" : "",
                !value && "text-muted-foreground",
                className,
              )}
              disabled={disabled}
              onClick={() => setOpen(!open)}
              type="button"
            >
              <span className="truncate">
                {value
                  ? selectedPayee
                    ? selectedPayee.name
                    : "Beneficiario no encontrado"
                  : placeholder}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {clearable && !disableClear && value && (
              <button
                type="button"
                className="-translate-y-1/2 absolute top-1/2 right-8 flex h-4 w-4 cursor-pointer items-center justify-center rounded p-0 hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear();
                  }
                }}
                aria-label="Limpiar selección"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false} onKeyDown={handleKeyDown}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="no-payee"
                  onSelect={() => handleSelect("no-payee")}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Sin beneficiario
                </CommandItem>
                {filteredPayees.map((payee) => (
                  <CommandItem
                    key={payee.id}
                    value={payee.id.toString()}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === payee.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {payee.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {allowCreate && searchQuery && !exactMatch && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer select-none items-center px-2 py-2 text-left text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={handleCreate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCreate();
                        }
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {createMessage} "{searchQuery}"
                    </button>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
