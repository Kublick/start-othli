import {
  boolean,
  foreignKey,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const accountType = pgEnum("account_type", [
  "checking",
  "savings",
  "credit",
  "investment",
  "cash",
]);
export const budgetType = pgEnum("budget_type", ["personal", "shared"]);
export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);
export const subscriptionPlanEnum = pgEnum("subscription_plan_enum", [
  "couples_basic",
]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing",
]);
export const transactionType = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
]);
export const userRole = pgEnum("user_role", ["user", "assistant", "admin"]);

export const budget = pgTable(
  "budget",
  {
    id: text().primaryKey().notNull(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    type: budgetType().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    currency: varchar({ length: 3 }).default("MXN").notNull(),
    startDate: timestamp("start_date", { mode: "string" }).notNull(),
    endDate: timestamp("end_date", { mode: "string" }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    userId: text("user_id"),
    sharedBudgetId: text("shared_budget_id"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "budget_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sharedBudgetId],
      foreignColumns: [sharedBudget.id],
      name: "budget_shared_budget_id_shared_budget_id_fk",
    }).onDelete("cascade"),
  ],
);

export const budgetCategory = pgTable(
  "budget_category",
  {
    id: text().primaryKey().notNull(),
    budgetId: text("budget_id").notNull(),
    categoryId: integer("category_id").notNull(),
    plannedAmount: numeric("planned_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    spentAmount: numeric("spent_amount", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.budgetId],
      foreignColumns: [budget.id],
      name: "budget_category_budget_id_budget_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "budget_category_category_id_categories_id_fk",
    }).onDelete("cascade"),
  ],
);

export const recurringTransaction = pgTable(
  "recurring_transaction",
  {
    id: text().primaryKey().notNull(),
    description: varchar({ length: 200 }).notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    type: transactionType().notNull(),
    currency: varchar({ length: 3 }).default("MXN").notNull(),
    frequency: varchar({ length: 20 }).notNull(),
    startDate: timestamp("start_date", { mode: "string" }).notNull(),
    endDate: timestamp("end_date", { mode: "string" }),
    isActive: boolean("is_active").default(true).notNull(),
    userId: text("user_id"),
    userAccountId: text("user_account_id"),
    categoryId: integer("category_id"),
    sharedBudgetId: text("shared_budget_id"),
    splitInfo: json("split_info"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "recurring_transaction_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "recurring_transaction_category_id_categories_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.sharedBudgetId],
      foreignColumns: [sharedBudget.id],
      name: "recurring_transaction_shared_budget_id_shared_budget_id_fk",
    }).onDelete("cascade"),
  ],
);

export const sharedBudget = pgTable(
  "shared_budget",
  {
    id: text().primaryKey().notNull(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    ownerId: text("owner_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [user.id],
      name: "shared_budget_owner_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ],
);

export const sharedBudgetMember = pgTable(
  "shared_budget_member",
  {
    id: text().primaryKey().notNull(),
    sharedBudgetId: text("shared_budget_id").notNull(),
    userId: text("user_id").notNull(),
    splitPercentage: numeric("split_percentage", {
      precision: 5,
      scale: 2,
    }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    joinedAt: timestamp("joined_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.sharedBudgetId],
      foreignColumns: [sharedBudget.id],
      name: "shared_budget_member_shared_budget_id_shared_budget_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "shared_budget_member_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const subscriptionPlan = pgTable("subscription_plan", {
  id: text().primaryKey().notNull(),
  name: subscriptionPlanEnum().notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  currency: varchar({ length: 3 }).default("MXN").notNull(),
  billingInterval: varchar("billing_interval", { length: 20 }).notNull(),
  maxSeats: integer("max_seats").default(2).notNull(),
  features: json(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
});

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity({
      name: "categories_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    name: varchar({ length: 40 }).notNull(),
    description: varchar({ length: 140 }),
    isIncome: boolean("is_income").default(false).notNull(),
    excludeFromBudget: boolean("exclude_from_budget").default(false).notNull(),
    excludeFromTotals: boolean("exclude_from_totals").default(false).notNull(),
    archived: boolean().default(false).notNull(),
    archivedOn: timestamp("archived_on", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }),
    isGroup: boolean("is_group").default(false).notNull(),
    groupId: integer("group_id"),
    order: integer().default(0).notNull(),
    groupCategoryName: varchar("group_category_name", { length: 100 }),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "categories_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const subscriptionSeat = pgTable(
  "subscription_seat",
  {
    id: text().primaryKey().notNull(),
    subscriptionId: text("subscription_id").notNull(),
    userId: text("user_id").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    assignedAt: timestamp("assigned_at", { mode: "string" }).notNull(),
    deactivatedAt: timestamp("deactivated_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.subscriptionId],
      foreignColumns: [userSubscription.id],
      name: "subscription_seat_subscription_id_user_subscription_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "subscription_seat_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const userAccount = pgTable(
  "user_account",
  {
    id: text().primaryKey().notNull(),
    name: varchar({ length: 100 }).notNull(),
    type: accountType().notNull(),
    balance: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
    currency: varchar({ length: 3 }).default("MXN").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const transaction = pgTable(
  "transaction",
  {
    id: text().primaryKey().notNull(),
    description: varchar({ length: 200 }).notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    type: transactionType().notNull(),
    currency: varchar({ length: 3 }).default("MXN").notNull(),
    date: timestamp({ mode: "string" }).notNull(),
    notes: text(),
    userId: text("user_id"),
    userAccountId: text("user_account_id"),
    categoryId: integer("category_id"),
    sharedBudgetId: text("shared_budget_id"),
    splitInfo: json("split_info"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "transaction_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "transaction_category_id_categories_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.sharedBudgetId],
      foreignColumns: [sharedBudget.id],
      name: "transaction_shared_budget_id_shared_budget_id_fk",
    }).onDelete("cascade"),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text(),
    role: userRole().default("user").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    isActive: boolean("is_active").default(true),
  },
  (table) => [unique("user_email_unique").on(table.email)],
);

export const userInvitation = pgTable(
  "user_invitation",
  {
    id: text().primaryKey().notNull(),
    inviterId: text("inviter_id").notNull(),
    inviteeEmail: text("invitee_email").notNull(),
    inviteeName: text("invitee_name"),
    status: invitationStatus().default("pending").notNull(),
    token: text().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
      name: "user_invitation_inviter_id_user_id_fk",
    }).onDelete("cascade"),
    unique("user_invitation_token_unique").on(table.token),
  ],
);

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const userSubscription = pgTable(
  "user_subscription",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    planId: text("plan_id").notNull(),
    status: subscriptionStatus().default("active").notNull(),
    currentPeriodStart: timestamp("current_period_start", {
      mode: "string",
    }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", {
      mode: "string",
    }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    canceledAt: timestamp("canceled_at", { mode: "string" }),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_subscription_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("user_subscription_stripe_subscription_id_unique").on(
      table.stripeSubscriptionId,
    ),
  ],
);

export const categoryGroups = pgTable("category_groups", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 40 }).notNull(),
  description: varchar({ length: 140 }),
  isIncome: boolean("is_income").default(false).notNull(),
  excludeFromBudget: boolean("exclude_from_budget").default(false).notNull(),
  excludeFromTotals: boolean("exclude_from_totals").default(false).notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const payees = pgTable("payees", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const rules = pgTable("rules", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  priority: integer().default(1).notNull(),
  conditions: text().notNull(),
  actions: text().notNull(),
  stopProcessing: boolean("stop_processing").default(false).notNull(),
  deleteAfterUse: boolean("delete_after_use").default(false).notNull(),
  runOnUpdates: boolean("run_on_updates").default(false).notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const transactionHistory = pgTable("transaction_history", {
  id: serial().primaryKey().notNull(),
  transactionId: text("transaction_id").notNull(),
  userId: text("user_id").notNull(),
  action: text().notNull(),
  details: jsonb(),
  timestamp: timestamp({ mode: "string" }).defaultNow().notNull(),
});
