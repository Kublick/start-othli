import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useAuthStore } from "@/store/store";

interface TrialStatus {
  isOnTrial: boolean;
  trialEndDate: Date | null;
  daysRemaining: number;
  hasActiveSubscription: boolean;
}

interface ApiResponse {
  hasActiveSubscription: boolean;
  isOnTrial: boolean;
  trialStart: string | null;
  trialEnd: string | null;
}

/**
 * Hook to check if the user is on a trial period
 * This implementation uses React Query to avoid unnecessary re-renders
 */
export function useSubscriptionTrial(): TrialStatus {
  const { user } = useAuthStore();

  const { data, isError } = useQuery<ApiResponse>({
    queryKey: ["subscription", "trial-status", user?.id],
    queryFn: async () => {
      const response = await client.api.subscription["trial-status"].$get();
      if (!response.ok) {
        throw new Error("Failed to fetch trial status");
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  if (isError || !data) {
    return {
      isOnTrial: false,
      trialEndDate: null,
      daysRemaining: 0,
      hasActiveSubscription: false,
    };
  }

  // Calculate days remaining if there's a trial end date
  let daysRemaining = 0;
  let trialEndDate = null;

  if (data.trialEnd) {
    trialEndDate = new Date(data.trialEnd);
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    isOnTrial: !!data.trialEnd,
    trialEndDate,
    daysRemaining: Math.max(0, daysRemaining),
    hasActiveSubscription: data.hasActiveSubscription,
  };
}
