/** biome-ignore-all lint/suspicious/noArrayIndexKey: <To parse the CSV file and show a preview of the data> */

import { useNavigate } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import type { ParseResult } from "papaparse";
import Papa from "papaparse";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImportStore } from "@/store/import-store";

interface TransactionImportDialogProps {
  accounts: { id: string; name: string }[];
  onImport?: (accountId: string, file: File) => void;
}

const TransactionImportDialog: React.FC<TransactionImportDialogProps> = ({
  accounts,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [rawPreviewOpen, setRawPreviewOpen] = useState(false);
  const [rawPreviewHeaders, setRawPreviewHeaders] = useState<string[]>([]);
  const [rawPreviewRows, setRawPreviewRows] = useState<
    Record<string, string>[]
  >([]);
  const [rawPreviewLoading, setRawPreviewLoading] = useState(false);
  const [rawPreviewError, setRawPreviewError] = useState<string | null>(null);
  const setImportData = useImportStore((s) => s.setImportData);
  const navigate = useNavigate();

  // Parse CSV for preview when dialog opens
  React.useEffect(() => {
    if (rawPreviewOpen && selectedFile) {
      setRawPreviewLoading(true);
      setRawPreviewError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const result: ParseResult<Record<string, string>> = Papa.parse<
            Record<string, string>
          >(text, { header: true, skipEmptyLines: true });
          setRawPreviewHeaders(result.meta.fields || []);
          setRawPreviewRows(result.data);
          setRawPreviewLoading(false);
        } catch (err) {
          console.error(err);
          setRawPreviewError("Error al leer el archivo CSV");
          setRawPreviewLoading(false);
        }
      };
      reader.onerror = () => {
        setRawPreviewError("Error al leer el archivo CSV");
        setRawPreviewLoading(false);
      };
      reader.readAsText(selectedFile);
    } else if (!rawPreviewOpen) {
      setRawPreviewHeaders([]);
      setRawPreviewRows([]);
      setRawPreviewLoading(false);
      setRawPreviewError(null);
    }
  }, [rawPreviewOpen, selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedAccountId && selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const result: ParseResult<Record<string, string>> = Papa.parse<
            Record<string, string>
          >(text, { header: true, skipEmptyLines: true });
          setImportData({
            rows: result.data,
            headers: result.meta.fields || [],
            accountId: selectedAccountId,
          });
          setDialogOpen(false);
          setSelectedAccountId("");
          setSelectedFile(null);
          navigate({ to: "/dashboard/finanzas/importar" });
        } catch (err) {
          console.log(err);
          toast.error("Error al importar transacciones");
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleOpen = () => {
    setDialogOpen(true);
    setSelectedAccountId("");
    setSelectedFile(null);
  };

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        <Upload className="mr-2 h-4 w-4" />
        Importar
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Importar transacciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1 block font-medium">
                Selecciona una cuenta
              </Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una cuenta..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedAccountId && (
              <div>
                <Label className="mb-1 block font-medium">
                  Selecciona archivo CSV
                </Label>
                <button
                  type="button"
                  className={`mb-4 flex w-full cursor-pointer select-none flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${dragActive ? "border-primary bg-muted/30" : "border-muted-foreground/40 hover:bg-muted/30"}`}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer?.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onClick={() =>
                    document.getElementById("csv-file-input")?.click()
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("csv-file-input")?.click();
                    }
                  }}
                  style={{ minHeight: 120 }}
                >
                  <Input
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
                {selectedFile && (
                  <div className="mt-2 text-muted-foreground text-xs">
                    Archivo seleccionado: {selectedFile.name}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between">
            {selectedFile && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRawPreviewOpen(true)}
              >
                Ver datos
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!selectedAccountId || !selectedFile}
              >
                Continuar
              </Button>
            </div>
          </DialogFooter>
          {/* Raw preview dialog */}
          <Dialog open={rawPreviewOpen} onOpenChange={setRawPreviewOpen}>
            <DialogContent className="w-full max-w-4xl">
              <DialogHeader>
                <DialogTitle>Vista previa del archivo CSV</DialogTitle>
              </DialogHeader>
              {rawPreviewLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Cargando...
                </div>
              ) : rawPreviewError ? (
                <div className="py-8 text-center text-red-600">
                  {rawPreviewError}
                </div>
              ) : rawPreviewHeaders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="mb-2 w-full border text-xs">
                    <thead>
                      <tr>
                        {rawPreviewHeaders.map((h) => (
                          <th key={h} className="border px-2 py-1">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawPreviewRows
                        .slice(0, 10)
                        .map((row: Record<string, string>, i: number) => (
                          <tr key={i}>
                            {rawPreviewHeaders.map((h: string) => (
                              <td key={h} className="border px-2 py-1">
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No hay datos para mostrar.
                </div>
              )}
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionImportDialog;
