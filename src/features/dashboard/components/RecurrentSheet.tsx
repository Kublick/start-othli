import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Account } from "../api/accounts";
import type { Category } from "../api/categories";
import type { Payee } from "../api/payees";
import { RecurringTransactionForm } from "./RecurringTransactionForm";

interface RecurrentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payees: Payee[];
  categories: Category[];
  accounts: Account[];
}

//   formData?: RecurringTransaction;
//   accounts: Account[];
//   categories: Category[];
//   payees: Payee[];
//   createPayee: (name: string) => Promise<void>;
//   createCategory: (name: string) => Promise<void>;
//   saveLoading: boolean;
//   editingRecurringTransactionId?: string;
//   onUpdateRecurringTransaction: (
//     data: { id: string } & RecurringTransactionFormData,
//   ) => void;
//   onCreateRecurringTransaction: (data: RecurringTransactionFormData) => void;
//   onOpenChange: (open: boolean) => void;

const RecurrentSheet = ({
  open,
  onOpenChange,
  payees,
  categories,
  accounts,
}: RecurrentSheetProps) => {
  console.log({ accounts });
  return (
    <div>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex h-screen max-h-screen w-[400px] flex-col sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Titulo</SheetTitle>
            <SheetDescription>Descripcion</SheetDescription>
          </SheetHeader>
          <div className="px-2 md:px-4">
            <RecurringTransactionForm
              accounts={accounts}
              categories={categories}
              payees={payees}
              createPayee={async (name) => {
                console.log(name);
              }}
              createCategory={async (name) => {
                console.log(name);
              }}
              saveLoading={false}
              onOpenChange={onOpenChange}
              onUpdateRecurringTransaction={async (data) => {
                console.log(data);
              }}
            />
          </div>
          <SheetFooter>
            <p>Footer</p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RecurrentSheet;
