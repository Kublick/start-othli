import { Hono } from "hono";
import { auth } from "./auth";
import type { Context } from "./context";
import { categoriesRouter } from "./routes/categoriesRouter";
import financialAccountRouter from "./routes/financialAccountRouter";
import payeesRouter from "./routes/payeesRouter";
import { seedRouter } from "./routes/seed";
import { setupRouter } from "./routes/setupRouter";
import transactionsRouter from "./routes/transactionsRouter";

const app = new Hono<{ Variables: Context }>();

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

const routes = app
  .get("/health", async (c) => c.text("OK"))
  .route("/api/seed", seedRouter)
  .basePath("/api")
  .route("/categories", categoriesRouter)
  .route("/financial-accounts", financialAccountRouter)
  .route("/setup", setupRouter)
  .route("/transactions", transactionsRouter)
  .route("/payees", payeesRouter);

export type AppType = typeof routes;

export default app;
