import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { authClient } from "@/lib/auth-client";

type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

type AuthActions = {
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
};

export const useAuthStore = create<
  AuthState & AuthActions,
  [
    ["zustand/persist", { user: User | null; isAuthenticated: boolean }],
    ["zustand/devtools", never],
  ]
>(
  persist(
    devtools(
      (set) => ({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,

        setUser: (user) =>
          set({ user, isAuthenticated: !!user }, undefined, "setUser"),
        setError: (error) => set({ error }, undefined, "setError"),
        setLoading: (isLoading) => set({ isLoading }, undefined, "setLoading"),

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null }, undefined, "login");
          try {
            // This would typically call your auth API
            // For now, we'll simulate a login
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
              throw new Error("Login failed");
            }

            const user = await response.json();
            set(
              { user, isAuthenticated: true, isLoading: false },
              undefined,
              "login-success",
            );
          } catch (error) {
            set(
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Authentication failed",
                isLoading: false,
              },
              undefined,
              "Auth-failed",
            );
            throw error;
          }
        },

        loginWithGoogle: async () => {
          set({ isLoading: true, error: null }, undefined, "loginWithGoogle");
          try {
            // This would typically redirect to Google OAuth
            // For now, we'll simulate it
            window.location.href = "/api/auth/google";
          } catch (error) {
            set(
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Google authentication failed",
                isLoading: false,
              },
              undefined,
              "loginWithGoogle-failed",
            );
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true, error: null }, undefined, "logout");
          try {
            await fetch("/api/auth/logout", { method: "POST" });
            set(
              { user: null, isAuthenticated: false, isLoading: false },
              undefined,
              "logout-success",
            );
          } catch (error) {
            set(
              {
                error: error instanceof Error ? error.message : "Logout failed",
                isLoading: false,
              },
              undefined,
              "logout-failed",
            );
            throw error;
          }
        },

        checkAuth: async () => {
          set({ isLoading: true }, undefined, "checkAuth-loading");
          try {
            const session = await authClient.getSession();
            if (session?.data?.user) {
              set(
                {
                  user: {
                    id: session.data.user.id,
                    email: session.data.user.email,
                    name: session.data.user.name,
                    image: session.data.user.image || undefined,
                  },
                  isAuthenticated: true,
                  isLoading: false,
                },
                undefined,
                "checkAuth-authenticated",
              );
            } else {
              set(
                { user: null, isAuthenticated: false, isLoading: false },
                undefined,
                "checkAuth-unauthenticated",
              );
            }
          } catch (error) {
            set(
              {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to verify authentication",
              },
              undefined,
              "checkAuth",
            );
          }
        },
      }),
      {
        name: "auth-storage",
      },
    ),
    { name: "auth-store" },
  ),
);
