import { create } from "zustand";

export type ImportRow = Record<string, string>;

interface ImportStoreState {
  rows: ImportRow[];
  headers: string[];
  accountId: string;
  mapping: { [col: string]: string };
  setImportData: (data: {
    rows: ImportRow[];
    headers: string[];
    accountId: string;
  }) => void;
  setMapping: (col: string, value: string) => void;
}

export const useImportStore = create<ImportStoreState>((set) => ({
  rows: [],
  headers: [],
  accountId: "",
  mapping: {},
  setImportData: ({ rows, headers, accountId }) =>
    set(() => ({
      rows,
      headers,
      accountId,
      mapping: Object.fromEntries(headers.map((h) => [h, "ignore"])),
    })),
  setMapping: (col, value) =>
    set((state) => ({ mapping: { ...state.mapping, [col]: value } })),
}));
