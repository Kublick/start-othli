import { client } from "./client";
import { getFinancialAccounts } from "./user-account-client";

export interface CategoryData {
  name: string;
  description?: string;
  isIncome: boolean;
  excludeFromBudget: boolean;
  excludeFromTotals: boolean;
}

export interface AccountData {
  name: string;
  type: string;
  balance: string;
  institutionName?: string;
  currency: string;
}

export const setupClient = {
  // Save user categories
  saveCategories: async (categories: CategoryData[]) => {
    try {
      const response = await client.api.categories.$post({
        json: { categories },
      });

      if (!response.ok) {
        throw new Error("Failed to save categories");
      }

      return response.json();
    } catch (error) {
      console.error("Error saving categories:", error);
      throw error;
    }
  },

  // Save user accounts
  saveAccounts: async (accounts: AccountData[]) => {
    try {
      const response = await client.api["financial-accounts"].$post({
        json: { accounts },
      });

      if (!response.ok) {
        throw new Error("Failed to save accounts");
      }

      return response.json();
    } catch (error) {
      console.error("Error saving accounts:", error);
      throw error;
    }
  },

  // Check if user has categories
  checkUserCategories: async () => {
    try {
      const response = await client.api.categories.$get();

      if (!response.ok) {
        throw new Error("Failed to check user categories");
      }

      const data = await response.json();
      return data.categories && data.categories.length > 0;
    } catch (error) {
      console.error("Error checking categories:", error);
      return false;
    }
  },

  // Check if user has accounts
  checkUserAccounts: async () => {
    try {
      const data = await getFinancialAccounts();
      return data.userAccounts && data.userAccounts.length > 0;
    } catch (error) {
      console.error("Error checking accounts:", error);
      return false;
    }
  },

  // Check setup completion status from database
  checkSetupStatus: async () => {
    try {
      const response = await client.api.setup.status.$get();

      if (!response.ok) {
        throw new Error("Failed to check setup status");
      }

      const data = await response.json();
      return data.setupCompleted;
    } catch (error) {
      console.error("Error checking setup status:", error);
      return false;
    }
  },

  // Mark setup as complete
  markSetupComplete: async () => {
    try {
      const response = await client.api.setup.complete.$post();

      if (!response.ok) {
        throw new Error("Failed to mark setup as complete");
      }

      return response.json();
    } catch (error) {
      console.error("Error marking setup complete:", error);
      throw error;
    }
  },
};
