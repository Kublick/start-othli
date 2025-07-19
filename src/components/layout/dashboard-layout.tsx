import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  LogOut,
  PiggyBank,
  Receipt,
  Search,
  Settings,
  Target,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { TrialNotificationBanner } from "@/components/subscription/trial-notification-banner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-session";
import { useSubscriptionTrial } from "@/hooks/use-subscription-trial";
import { useAuthStore } from "@/store/store";
import TopNavBar from "./top-navbar";

interface DashboardLayoutProps {
  children?: React.ReactNode;
  title?: string;
}

export function AuthSyncProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (session?.user) {
      setUser({
        ...session.user,
        image: session.user.image || undefined,
      });
    } else {
      setUser(null);
    }
  }, [session, setUser]);

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
  title = "Dashboard",
}: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const { isOnTrial, trialEndDate, daysRemaining } = useSubscriptionTrial();

  // Get current year and month for navigation links
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

  return (
    <AuthSyncProvider>
      <div className="2xl:hidden">
        <TopNavBar />
      </div>
      {/* Sidebar for 2xl and above */}
      <SidebarProvider>
        <div className="hidden 2xl:block">
          <Sidebar>
            <SidebarHeader>
              <div className="flex h-16 items-center px-4">
                <h2 className="font-semibold text-lg">Ometomi</h2>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/dashboard/overview">
                          <Home className="h-4 w-4" />
                          <span>Home</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/dashboard/overview">
                              <BarChart3 className="h-4 w-4" />
                              <span>Resumen</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/dashboard/overview">
                              <PiggyBank className="h-4 w-4" />
                              <span>Patrimonio</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/dashboard/analisis">
                              <Search className="h-4 w-4" />
                              <span>Analisis</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/config/categorias">
                          <Settings className="h-4 w-4" />
                          <span>Configuración</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/config/cuentas">
                              <User className="h-4 w-4" />
                              <span>Cuentas</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/config/categorias">
                              <FileText className="h-4 w-4" />
                              <span>Categorías</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/dashboard/overview">
                          <CreditCard className="h-4 w-4" />
                          <span>Finanzas</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link
                              to="/dashboard/finanzas/presupuestos"
                              search={{
                                year: currentYear,
                                month: currentMonth,
                              }}
                            >
                              <Target className="h-4 w-4" />
                              <span>Presupuesto</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link
                              to="/dashboard/finanzas/transacciones"
                              search={{
                                year: currentYear,
                                month: currentMonth,
                                accountId: undefined, // Always include the key, even if you don't have a value
                              }}
                            >
                              <Receipt className="h-4 w-4" />
                              <span>Transacciones</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.image || "/avatar_image.png"}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>
                      {user?.name?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      {user?.name || "Usuario"}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {user?.email || "usuario@example.com"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
        </div>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border" />
              <h1 className="font-semibold text-lg">{title}</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="mx-auto w-full max-w-full px-2 sm:max-w-screen-md sm:px-4 md:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl">
              {isOnTrial && (
                <TrialNotificationBanner
                  trialEndDate={trialEndDate}
                  daysRemaining={daysRemaining}
                />
              )}
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthSyncProvider>
  );
}
