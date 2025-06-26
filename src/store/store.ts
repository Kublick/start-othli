import { toast } from "sonner";
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
            const { data } = await authClient.signIn.email(
              {
                email,
                password,
                callbackURL: "/dashboard/overview",
              },
              {
                onSuccess: async () => {
                  toast.success("Inicio de sesión exitoso");
                  // Account creation is now handled by the setup wizard
                },
                onError: (ctx) => {
                  console.log(ctx.error.status);
                  if (ctx.error.status === 401) {
                    toast.error("Error en las credenciales");
                  }
                  if (ctx.error.status === 403) {
                    toast.error("La cuenta no esta verificada");
                  }
                  return;
                },
              },
            );

            set(
              {
                user: data?.user as User,
                isAuthenticated: true,
                isLoading: false,
              },
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
            console.log(error);
            toast.error("Ocurrio un error al iniciar sesión");
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
            await authClient.signOut();

            window.location.href = "/auth/login";
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
              // Account creation is now handled by the setup wizard
            } else {
              set(
                {
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                },
                undefined,
                "checkAuth-not-authenticated",
              );
            }
          } catch (error) {
            set(
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Authentication check failed",
                isLoading: false,
              },
              undefined,
              "checkAuth-failed",
            );
            console.error("Error checking authentication:", error);
          }
        },
      }),
      {
        name: "auth-storage",
        partialize: (state: AuthState & AuthActions) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    {
      name: "auth-devtools",
    },
  ),
);
