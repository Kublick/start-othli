import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const userRoleEnum = pgEnum("user_role", ["user", "assistant", "admin"]);
export const accountTypeEnum = pgEnum("account_type", [
  "efectivo",
  "debito",
  "credito",
  "inversion",
]);
export const budgetTypeEnum = pgEnum("budget_type", ["personal", "shared"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);
export const subscriptionPlanEnum = pgEnum("subscription_plan_enum", [
  "couples_basic",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  setupCompleted: boolean("setup_completed").default(false).notNull(),
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

export const userAccount = pgTable("user_account", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  isActive: boolean("is_active").default(true).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  subtypeName: text("subtype_name"),
  displayName: text("display_name"),
  balanceAsOf: timestamp("balance_as_of").notNull().defaultNow(),
  closedOn: timestamp("closed_on"),
  institutionName: text("institution_name"),
  excludeTransactions: boolean("exclude_transactions").notNull().default(false),
});

export const payees = pgTable("payees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const categoryGroups = pgTable("category_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 40 }).notNull(),
  description: varchar("description", { length: 140 }),
  isIncome: boolean("is_income").default(false).notNull(),
  excludeFromBudget: boolean("exclude_from_budget").default(false).notNull(),
  excludeFromTotals: boolean("exclude_from_totals").default(false).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  priority: integer("priority").notNull().default(1),
  conditions: text("conditions").notNull(),
  actions: text("actions").notNull(),
  stopProcessing: boolean("stop_processing").default(false).notNull(),
  deleteAfterUse: boolean("delete_after_use").default(false).notNull(),
  runOnUpdates: boolean("run_on_updates").default(false).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transaction = pgTable("transaction", {
  id: text("id").primaryKey(),
  description: varchar("description", { length: 200 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  userAccountId: text("user_account_id").references(() => userAccount.id, {
    onDelete: "cascade",
  }),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  sharedBudgetId: text("shared_budget_id").references(() => sharedBudget.id, {
    onDelete: "cascade",
  }),
  splitInfo: json("split_info"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  payeeId: integer("payee_id").references(() => payees.id, {
    onDelete: "set null",
  }),
  isTransfer: boolean("is_transfer").notNull().default(false),
  transferAccountId: text("transfer_account_id").references(
    () => userAccount.id,
    {
      onDelete: "set null",
    },
  ),
  // New field for linking to recurring transactions
  recurringTransactionId: text("recurring_transaction_id").references(
    () => recurringTransaction.id,
    { onDelete: "set null" },
  ),
});

export const transactionHistory = pgTable("transaction_history", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const recurringTransaction = pgTable("recurring_transaction", {
  id: text("id").primaryKey(),
  description: varchar("description", { length: 200 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  frequency: varchar("frequency", { length: 20 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  userAccountId: text("user_account_id").references(() => userAccount.id, {
    onDelete: "cascade",
  }),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  sharedBudgetId: text("shared_budget_id").references(() => sharedBudget.id, {
    onDelete: "cascade",
  }),
  splitInfo: json("split_info"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  payeeId: integer("payee_id").references(() => payees.id, {
    onDelete: "set null",
  }),
});

export const subscriptionPlan = pgTable("subscription_plan", {
  id: text("id").primaryKey(),
  name: subscriptionPlanEnum("name").notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  billingInterval: varchar("billing_interval", { length: 20 }).notNull(),
  maxSeats: integer("max_seats").default(2).notNull(),
  features: json("features"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const userSubscription = pgTable("user_subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => subscriptionPlan.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  canceledAt: timestamp("canceled_at"),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const subscriptionSeat = pgTable("subscription_seat", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => userSubscription.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  assignedAt: timestamp("assigned_at").notNull(),
  deactivatedAt: timestamp("deactivated_at"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const sharedBudget = pgTable("shared_budget", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const sharedBudgetMember = pgTable("shared_budget_member", {
  id: text("id").primaryKey(),
  sharedBudgetId: text("shared_budget_id")
    .notNull()
    .references(() => sharedBudget.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  splitPercentage: decimal("split_percentage", {
    precision: 5,
    scale: 2,
  }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  joinedAt: timestamp("joined_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const userInvitation = pgTable("user_invitation", {
  id: text("id").primaryKey(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  inviteeEmail: text("invitee_email").notNull(),
  inviteeName: text("invitee_name"),
  status: invitationStatusEnum("status").notNull().default("pending"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const budget = pgTable("budget", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: budgetTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  sharedBudgetId: text("shared_budget_id").references(() => sharedBudget.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  year: integer("year"),
  month: integer("month"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
});

export const budgetCategory = pgTable("budget_category", {
  id: text("id").primaryKey(),
  budgetId: text("budget_id")
    .notNull()
    .references(() => budget.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  plannedAmount: decimal("planned_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  spentAmount: decimal("spent_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  userAccounts: many(userAccount),
  categories: many(categories),
  categoryGroups: many(categoryGroups),
  payees: many(payees),
  rules: many(rules),
  transactions: many(transaction),
  transactionHistory: many(transactionHistory),
  recurringTransactions: many(recurringTransaction),
  userSubscriptions: many(userSubscription),
  subscriptionSeats: many(subscriptionSeat),
  sharedBudgets: many(sharedBudget),
  sharedBudgetMembers: many(sharedBudgetMember),
  userInvitations: many(userInvitation),
  budgets: many(budget),
}));

export const transactionRelations = relations(transaction, ({ one, many }) => ({
  account: one(userAccount, {
    fields: [transaction.userAccountId],
    references: [userAccount.id],
  }),
  user: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [transaction.categoryId],
    references: [categories.id],
  }),
  payee: one(payees, {
    fields: [transaction.payeeId],
    references: [payees.id],
  }),
  transferAccount: one(userAccount, {
    fields: [transaction.transferAccountId],
    references: [userAccount.id],
    relationName: "transferAccount",
  }),
  sharedBudget: one(sharedBudget, {
    fields: [transaction.sharedBudgetId],
    references: [sharedBudget.id],
  }),
  history: many(transactionHistory),
}));

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type UserAccount = typeof userAccount.$inferSelect;
export type Payee = typeof payees.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type CategoryGroup = typeof categoryGroups.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type Transaction = typeof transaction.$inferSelect;
export type TransactionHistory = typeof transactionHistory.$inferSelect;
export type RecurringTransaction = typeof recurringTransaction.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlan.$inferSelect;
export type UserSubscription = typeof userSubscription.$inferSelect;
export type SubscriptionSeat = typeof subscriptionSeat.$inferSelect;
export type SharedBudget = typeof sharedBudget.$inferSelect;
export type SharedBudgetMember = typeof sharedBudgetMember.$inferSelect;
export type UserInvitation = typeof userInvitation.$inferSelect;
export type Budget = typeof budget.$inferSelect;
export type BudgetCategory = typeof budgetCategory.$inferSelect;

export const categoryInsertSchema = createInsertSchema(categories);
export const categorySelectSchema = createSelectSchema(categories);
export const userAccountInsertSchema = createInsertSchema(userAccount);
export const transactionInsertSchema = createInsertSchema(transaction);
export const budgetInsertSchema = createInsertSchema(budget);
export const budgetCategoryInsertSchema = createInsertSchema(budgetCategory);
