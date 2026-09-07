import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Send,
  Megaphone,
  PanelsTopLeft,
  LogOut,
  Menu,
  Quote,
  X,
  Search,
  Settings,
} from "lucide-react";
import { cn, initialsOf } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeCard } from "@/features/billing/upgrade-card";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/testimonials", label: "Testimonials", icon: Video },
  { to: "/search", label: "Search", icon: Search },
  { to: "/requests", label: "Requests", icon: Send },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/embeds", label: "Embeds", icon: PanelsTopLeft },
  { to: "/settings", label: "Settings", icon: Settings },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Quote className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold tracking-tight text-gray-900">Vouch</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )
            }
          >
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <UpgradeCard />
      </div>

      <div className="border-t border-gray-100 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {user ? initialsOf(user.name) : "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-900">{user?.name}</span>
              <span className="block truncate text-xs text-gray-500">{user?.email}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel>
              {user?.company_name ?? user?.name}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await logout();
                navigate("/login");
              }}
              className="text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile header + drawer */}
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Quote className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold text-gray-900">Vouch</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-gray-950/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="px-4 py-8 sm:px-6 lg:ml-64 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
