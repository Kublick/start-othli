import { Upload } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TransactionImportDialogProps {
  accounts: { id: string; name: string }[];
  onImport?: (accountId: string, file: File) => void;
}

const TransactionImportDialog: React.FC<TransactionImportDialogProps> = ({
  accounts,
  onImport,
}) => {
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleStartImport = () => {
    setAccountDialogOpen(true);
  };
  const handleAccountContinue = () => {
    setAccountDialogOpen(false);
    setFileDialogOpen(true);
  };
  const handleFileCancel = () => {
    setFileDialogOpen(false);
    setSelectedFile(null);
    setSelectedAccountId("");
  };
  const handleFileImport = () => {
    if (onImport && selectedAccountId && selectedFile) {
      onImport(selectedAccountId, selectedFile);
    }
    setFileDialogOpen(false);
    setSelectedFile(null);
    setSelectedAccountId("");
  };
  const handleFileDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) setSelectedFile(file);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) setSelectedFile(file);
  };

  return (
    <>
      <div className="mb-2 flex w-full justify-end">
        <Button onClick={handleStartImport} variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </div>
      {/* Account Selection Dialog */}
      <AlertDialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selecciona una cuenta</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona la cuenta a la que deseas importar transacciones:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <select
              className="w-full rounded border px-3 py-2"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="">Selecciona una cuenta...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!selectedAccountId}
              onClick={handleAccountContinue}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* File Upload Dialog */}
      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar archivo CSV</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            className="mb-4 flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted-foreground/40 border-dashed p-6 transition hover:bg-muted/30"
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("csv-file-input")?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                document.getElementById("csv-file-input")?.click();
              }
            }}
            style={{ minHeight: 120 }}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            {selectedFile ? (
              <div className="font-medium text-primary text-sm">
                {selectedFile.name}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                Arrastra y suelta un archivo CSV aquí
                <br />o haz clic para seleccionar
              </div>
            )}
          </button>
          <DialogFooter>
            <Button variant="outline" onClick={handleFileCancel} type="button">
              Cancelar
            </Button>
            <Button
              onClick={handleFileImport}
              disabled={!selectedFile}
              type="button"
            >
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionImportDialog;
