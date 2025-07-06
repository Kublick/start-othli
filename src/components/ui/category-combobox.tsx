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
import type { Category } from "@/features/dashboard/api/categories";
import { cn } from "@/lib/utils";

export interface CategoryComboboxProps {
  value?: number;
  onChange?: (categoryId: number | undefined) => void;
  categories: Category[];
  onCreateCategory: (name: string) => Promise<number | undefined>;
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

export const CategoryCombobox = React.forwardRef<
  HTMLButtonElement,
  CategoryComboboxProps
>(
  (
    {
      value,
      onChange,
      categories,
      onCreateCategory,
      placeholder = "Selecciona una categoría",
      searchPlaceholder = "Buscar categoría",
      emptyMessage = "No se encontraron categorías",
      createMessage = "Crear categoría",
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

    const selectedCategory = React.useMemo(
      () => categories.find((cat) => cat.id === value),
      [categories, value],
    );

    const filteredCategories = React.useMemo(() => {
      if (!searchQuery) return categories;
      return categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }, [categories, searchQuery]);

    const exactMatch = React.useMemo(() => {
      return categories.some(
        (cat) => cat.name.toLowerCase() === searchQuery.toLowerCase(),
      );
    }, [categories, searchQuery]);

    const handleSelect = (currentValue: string) => {
      const categoryId = Number.parseInt(currentValue, 10);
      const newValue = categoryId === value ? undefined : categoryId;
      onChange?.(newValue);
      setOpen(false);
    };

    const handleCreate = async () => {
      if (!searchQuery.trim()) return;
      const createdCategoryId = await onCreateCategory(searchQuery.trim());
      if (createdCategoryId) {
        onChange?.(createdCategoryId);
      }
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
                  ? selectedCategory
                    ? selectedCategory.name
                    : "Categoría no encontrada"
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
                  value="no-category"
                  onSelect={() => handleSelect("no-category")}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Sin categoría
                </CommandItem>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id.toString()}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {category.name}
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
