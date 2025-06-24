import { createServerFileRoute } from "@tanstack/react-start/server";
import app from "@/server";

async function handle({ request }: { request: Request }) {
  return app.fetch(request);
}

export const ServerRoute = createServerFileRoute("/api/$").methods({
  GET: handle,
  POST: handle,
  PUT: handle,
  PATCH: handle,
  DELETE: handle,
});
