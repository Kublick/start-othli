import { and, eq, gte, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { categories, transaction, userAccount } from "@/db/schema";
import type { Context } from "../context";
import { loggedIn } from "../middleware/logged-in";

export const summaryRouter = new Hono<{ Variables: Context }>().get(
  "/",
  loggedIn,
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { start, end } = c.req.query();
    if (!start || !end) {
      return c.json({ error: "Missing start or end date" }, 400);
    }

    // Fetch transactions for the user in the date range, excluding transfers
    const txs = await db
      .select()
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, user.id),
          gte(transaction.date, new Date(start)),
          lte(transaction.date, new Date(end)),
          eq(transaction.isTransfer, false),
        ),
      );

    // Fetch all accounts for the user
    const accts = await db
      .select()
      .from(userAccount)
      .where(eq(userAccount.userId, user.id));

    // Fetch all categories for the user
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id));

    // Group by category
    const categoryMap = Object.fromEntries(cats.map((c) => [c.id, c]));

    // Calculate account balances as of the end date using a single aggregated query
    const accountBalanceResults = await db
      .select({
        userAccountId: transaction.userAccountId,
        balance: sql<number>`COALESCE(SUM(${transaction.amount}::numeric), 0)`,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, user.id),
          eq(transaction.isTransfer, false),
          lte(transaction.date, new Date(end)), // Up to end date
        ),
      )
      .groupBy(transaction.userAccountId);

    // Create a map of account balances
    const balanceMap = Object.fromEntries(
      accountBalanceResults.map((r) => [r.userAccountId, Number(r.balance)]),
    );

    // Build account summaries with calculated balances
    const accountBalances = accts.map((acct) => ({
      id: acct.id,
      name: acct.name,
      type: acct.type,
      balance: balanceMap[acct.id] || 0,
    }));

    // Aggregate transactions in the date range
    let income = 0;
    let expenses = 0;
    const categoryTotals: Record<
      number,
      { amount: number; isIncome: boolean }
    > = {};

    for (const tx of txs) {
      // Convert decimal to number
      const amount = Number(tx.amount);

      // Get category and determine if it's income
      const cat = tx.categoryId ? categoryMap[tx.categoryId] : undefined;
      const isIncome = cat?.isIncome ?? false;

      if (isIncome) {
        income += amount;
      } else {
        expenses += amount;
      }

      if (tx.categoryId) {
        if (!categoryTotals[tx.categoryId]) {
          categoryTotals[tx.categoryId] = {
            amount: 0,
            isIncome,
          };
        }
        categoryTotals[tx.categoryId].amount += amount;
      }
    }

    const netIncome = income - expenses;
    const savingsRate = income > 0 ? netIncome / income : 0;

    // Net worth = sum of all account balances as of end date
    const netWorth = accountBalances.reduce(
      (sum, a) => sum + (a.balance || 0),
      0,
    );

    // Category breakdown
    const totalExpenses = Math.abs(expenses);
    const totalIncome = income;
    const categoryBreakdown = Object.entries(categoryTotals).map(
      ([catId, { amount, isIncome }]) => {
        const cat = categoryMap[Number(catId)];
        const percent = isIncome
          ? totalIncome > 0
            ? amount / totalIncome
            : 0
          : totalExpenses > 0
            ? Math.abs(amount) / totalExpenses
            : 0;
        return {
          id: cat.id,
          name: cat.name,
          amount: Math.abs(amount),
          type: isIncome ? "income" : "expense",
          percent,
        };
      },
    );

    return c.json({
      dateRange: { start, end },
      accounts: accountBalances,
      netWorth,
      income,
      expenses: Math.abs(expenses),
      netIncome,
      savingsRate,
      categories: categoryBreakdown,
    });
  },
);
