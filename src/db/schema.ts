import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const userRoleEnum = pgEnum("user_role", ["user", "assistant", "admin"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  isActive: boolean("is_active").default(true),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const categories = pgTable("categories", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: varchar("name", { length: 40 }).notNull(),
  description: varchar("description", { length: 140 }),
  isIncome: boolean("is_income").default(false).notNull(),
  excludeFromBudget: boolean("exclude_from_budget").default(false).notNull(),
  excludeFromTotals: boolean("exclude_from_totals").default(false).notNull(),
  archived: boolean("archived").default(false).notNull(),
  archivedOn: timestamp("archived_on"),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at"),
  isGroup: boolean("is_group").default(false).notNull(),
  groupId: integer("group_id"),
  order: integer("order").default(0).notNull(),
  groupCategoryName: varchar("group_category_name", { length: 100 }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export type Category = typeof categories.$inferSelect;
export const categoryInsertSchema = createInsertSchema(categories);
export const categorySelectSchema = createSelectSchema(categories);
