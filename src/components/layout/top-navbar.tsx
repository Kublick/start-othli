/** biome-ignore-all lint/a11y/noStaticElementInteractions: No new languages will be impl */
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronDown,
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
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/store";

// Helper for submenu popover
function NavDropdown({
  label,
  icon,
  children,
  open,
  onOpen,
  onClose,
  dropdownKey,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpen: (key: string) => void;
  onClose: () => void;
  dropdownKey: string;
}) {
  return (
    <div
      className="relative"
      role="presentation"
      onMouseEnter={() => onOpen(dropdownKey)}
      onMouseLeave={onClose}
    >
      <button
        className={`flex items-center gap-1 rounded-md px-3 py-2 hover:bg-gray-100 focus:outline-none ${open ? "bg-gray-100" : ""}`}
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={open}
        type="button"
        onClick={() => (open ? onClose() : onOpen(dropdownKey))}
        onFocus={() => onOpen(dropdownKey)}
        onBlur={onClose}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown
          className="ml-1 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-20 min-w-[180px] rounded-md bg-white py-2 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

export default function TopNavBar() {
  const { user, logout } = useAuthStore();
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const handleOpen = (key: string) => setOpenDropdown(key);
  const handleClose = () => setOpenDropdown(null);

  return (
    <nav className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm ">
      <div className="flex items-center gap-4">
        <span className="font-semibold text-lg">Ometomi</span>
        <div className="flex gap-1">
          {/* Home + subroutes */}
          <NavDropdown
            label="Home"
            icon={<Home className="h-4 w-4" />}
            open={openDropdown === "home"}
            onOpen={handleOpen}
            onClose={handleClose}
            dropdownKey="home"
          >
            <Link
              to="/dashboard/overview"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Resumen</span>
            </Link>
            <Link
              to="/dashboard/overview"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
            >
              <PiggyBank className="h-4 w-4" />
              <span>Patrimonio</span>
            </Link>
            <Link
              to="/dashboard/analisis"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
            >
              <Search className="h-4 w-4" />
              <span>Analisis</span>
            </Link>
          </NavDropdown>
          {/* Configuración + subroutes */}
          <NavDropdown
            label="Configuración"
            icon={<Settings className="h-4 w-4" />}
            open={openDropdown === "config"}
            onOpen={handleOpen}
            onClose={handleClose}
            dropdownKey="config"
          >
            <Link
              to="/config/cuentas"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              <span>Cuentas</span>
            </Link>
            <Link
              to="/config/categorias"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              <span>Categorías</span>
            </Link>
          </NavDropdown>
          {/* Finanzas + subroutes */}
          <NavDropdown
            label="Finanzas"
            icon={<CreditCard className="h-4 w-4" />}
            open={openDropdown === "finanzas"}
            onOpen={handleOpen}
            onClose={handleClose}
            dropdownKey="finanzas"
          >
            <Link
              to="/dashboard/finanzas/presupuestos"
              search={{ year: currentYear, month: currentMonth }}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
            >
              <Target className="h-4 w-4" />
              <span>Presupuesto</span>
            </Link>
            <Link
              to="/dashboard/finanzas/transacciones"
              search={{
                year: currentYear,
                month: currentMonth,
                accountId: undefined,
              }}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
            >
              <Receipt className="h-4 w-4" />
              <span>Transacciones</span>
            </Link>
          </NavDropdown>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-auto p-0 hover:bg-transparent"
            >
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
                <div className="hidden min-w-0 flex-1 sm:block text-left">
                  <p className="truncate font-medium text-sm">
                    {user?.name || "Usuario"}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {user?.email || "usuario@example.com"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/config/cuentas" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
