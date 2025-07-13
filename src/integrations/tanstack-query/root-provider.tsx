import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type * as React from "react";

export function createQueryClient() {
  return new QueryClient();
}

export function Provider({
  client,
  children,
}: {
  client: QueryClient;
  children: React.ReactNode;
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
