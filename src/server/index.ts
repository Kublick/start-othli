import { Hono } from "hono";
import { auth } from "./auth";
import type { Context } from "./context";
import { categoriesRouter } from "./routes/categoriesRouter";

const app = new Hono<{ Variables: Context }>();

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  console.log("🚀 ~ app.use ~ session:", session);
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  c.set("session", session.session);
  return next();
});

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

const routes = app
  .get("/health", async (c) => c.text("OK"))
  .basePath("/api")
  .route("/categories", categoriesRouter);

export type AppType = typeof routes;

export default app;
