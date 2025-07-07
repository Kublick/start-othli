import { create } from "zustand";

interface ImportStoreState {
  rows: any[];
  headers: string[];
  accountId: string;
  mapping: { [col: string]: string };
  setImportData: (data: {
    rows: any[];
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
