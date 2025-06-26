import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { setupClient } from "@/lib/setup-client";

interface SetupStatus {
  hasCategories: boolean;
  hasAccounts: boolean;
  isComplete: boolean;
  isLoading: boolean;
}

export function useSetupStatus() {
  const [status, setStatus] = useState<SetupStatus>({
    hasCategories: false,
    hasAccounts: false,
    isComplete: false,
    isLoading: true,
  });

  const checkSetupStatus = useCallback(async () => {
    try {
      setStatus((prev) => ({ ...prev, isLoading: true }));

      // First check the database setup completion status
      const setupCompleted = await setupClient.checkSetupStatus();

      if (setupCompleted) {
        // If setup is marked as complete in database, we're done
        setStatus({
          hasCategories: true,
          hasAccounts: true,
          isComplete: true,
          isLoading: false,
        });
        return;
      }

      // If not marked as complete, check if user has categories and accounts
      const [hasCategories, hasAccounts] = await Promise.all([
        setupClient.checkUserCategories(),
        setupClient.checkUserAccounts(),
      ]);

      setStatus({
        hasCategories,
        hasAccounts,
        isComplete: hasCategories && hasAccounts,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error checking setup status:", error);
      // Don't show error toast here as it might be expected for new users
      setStatus((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    checkSetupStatus();
  }, [checkSetupStatus]);

  const markSetupComplete = async () => {
    try {
      await setupClient.markSetupComplete();
      setStatus((prev) => ({ ...prev, isComplete: true }));
      toast.success("Configuración marcada como completada");
    } catch (error) {
      console.error("Error marking setup complete:", error);
      toast.error("Error al marcar la configuración como completada");
    }
  };

  return {
    ...status,
    checkSetupStatus,
    markSetupComplete,
  };
}
