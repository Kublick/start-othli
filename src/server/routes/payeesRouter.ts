import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { payees } from "@/db/schema";
import type { Context } from "../context";

const payeesRouter = new Hono<{ Variables: Context }>()
  .get("/", async (c) => {
    const user = c.get("user");
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const allPayees = await db
      .select()
      .from(payees)
      .where(eq(payees.userId, user.id))
      .orderBy(desc(payees.createdAt));
    return c.json({ payees: allPayees });
  })
  .post("/", async (c) => {
    const user = c.get("user");
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { name } = await c.req.json();
    if (!name || typeof name !== "string") {
      return c.json({ error: "El nombre es requerido" }, 400);
    }
    const [newPayee] = await db
      .insert(payees)
      .values({
        name: name.trim(),
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return c.json({ payee: newPayee });
  });

export default payeesRouter;
