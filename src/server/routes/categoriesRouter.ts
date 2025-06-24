import { Hono } from "hono";
import { db } from "@/db";
import { categorySelectSchema } from "@/db/schema";
import type { Context } from "../context";

export const categoriesRouter = new Hono<{ Variables: Context }>().get(
  "/",

  async (c) => {
    const categories = await db.query.categories.findMany();

    const result = categorySelectSchema.array().parse(categories);

    return c.json({
      categories: result,
    });
  },
);
