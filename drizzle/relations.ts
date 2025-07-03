import { relations } from "drizzle-orm/relations";
import {
  account,
  budget,
  budgetCategory,
  categories,
  recurringTransaction,
  session,
  sharedBudget,
  sharedBudgetMember,
  subscriptionSeat,
  transaction,
  user,
  userAccount,
  userInvitation,
  userSubscription,
} from "../src/db/schema";

export const budgetRelations = relations(budget, ({ one, many }) => ({
  user: one(user, {
    fields: [budget.userId],
    references: [user.id],
  }),
  sharedBudget: one(sharedBudget, {
    fields: [budget.sharedBudgetId],
    references: [sharedBudget.id],
  }),
  budgetCategories: many(budgetCategory),
}));

export const userRelations = relations(user, ({ many }) => ({
  budgets: many(budget),
  recurringTransactions: many(recurringTransaction),
  sharedBudgets: many(sharedBudget),
  sessions: many(session),
  sharedBudgetMembers: many(sharedBudgetMember),
  accounts: many(account),
  categories: many(categories),
  subscriptionSeats: many(subscriptionSeat),
  userAccounts: many(userAccount),
  transactions: many(transaction),
  userInvitations: many(userInvitation),
  userSubscriptions: many(userSubscription),
}));

export const sharedBudgetRelations = relations(
  sharedBudget,
  ({ one, many }) => ({
    budgets: many(budget),
    recurringTransactions: many(recurringTransaction),
    user: one(user, {
      fields: [sharedBudget.ownerId],
      references: [user.id],
    }),
    sharedBudgetMembers: many(sharedBudgetMember),
    transactions: many(transaction),
  }),
);

export const budgetCategoryRelations = relations(budgetCategory, ({ one }) => ({
  budget: one(budget, {
    fields: [budgetCategory.budgetId],
    references: [budget.id],
  }),
  category: one(categories, {
    fields: [budgetCategory.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  budgetCategories: many(budgetCategory),
  recurringTransactions: many(recurringTransaction),
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
  transactions: many(transaction),
}));

export const recurringTransactionRelations = relations(
  recurringTransaction,
  ({ one }) => ({
    user: one(user, {
      fields: [recurringTransaction.userId],
      references: [user.id],
    }),
    category: one(categories, {
      fields: [recurringTransaction.categoryId],
      references: [categories.id],
    }),
    sharedBudget: one(sharedBudget, {
      fields: [recurringTransaction.sharedBudgetId],
      references: [sharedBudget.id],
    }),
  }),
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const sharedBudgetMemberRelations = relations(
  sharedBudgetMember,
  ({ one }) => ({
    sharedBudget: one(sharedBudget, {
      fields: [sharedBudgetMember.sharedBudgetId],
      references: [sharedBudget.id],
    }),
    user: one(user, {
      fields: [sharedBudgetMember.userId],
      references: [user.id],
    }),
  }),
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const subscriptionSeatRelations = relations(
  subscriptionSeat,
  ({ one }) => ({
    userSubscription: one(userSubscription, {
      fields: [subscriptionSeat.subscriptionId],
      references: [userSubscription.id],
    }),
    user: one(user, {
      fields: [subscriptionSeat.userId],
      references: [user.id],
    }),
  }),
);

export const userSubscriptionRelations = relations(
  userSubscription,
  ({ one, many }) => ({
    subscriptionSeats: many(subscriptionSeat),
    user: one(user, {
      fields: [userSubscription.userId],
      references: [user.id],
    }),
  }),
);

export const userAccountRelations = relations(userAccount, ({ one }) => ({
  user: one(user, {
    fields: [userAccount.userId],
    references: [user.id],
  }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  user: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [transaction.categoryId],
    references: [categories.id],
  }),
  sharedBudget: one(sharedBudget, {
    fields: [transaction.sharedBudgetId],
    references: [sharedBudget.id],
  }),
}));

export const userInvitationRelations = relations(userInvitation, ({ one }) => ({
  user: one(user, {
    fields: [userInvitation.inviterId],
    references: [user.id],
  }),
}));
