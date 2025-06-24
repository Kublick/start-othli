import { createFileRoute } from "@tanstack/react-router";

import { client } from "@/lib/client";

export const Route = createFileRoute("/config/categorias")({
  component: RouteComponent,
  loader: async () => {
    const resp = await client.api.categories.$get();
    const data = await resp.json();
    return { data };
  },
});

function RouteComponent() {
  const { data } = Route.useLoaderData();

  return <div>{JSON.stringify(data)}</div>;
}
