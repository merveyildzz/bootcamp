import { NavLink } from "react-router-dom";
import { LayoutDashboard, Shirt, MessageCircle, Layers, CalendarDays, BarChart3, LogOut, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { Avatar } from "@/shared/ui/Avatar";

const navItems = [
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { to: "/wardrobe", label: "Gardırop", icon: Shirt },
  { to: "/chat", label: "AI Sohbet", icon: MessageCircle },
  { to: "/outfits", label: "Kombinlerim", icon: Layers },
  { to: "/events", label: "Etkinlikler", icon: CalendarDays },
  { to: "/stats", label: "İstatistikler", icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-svh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6",
        "transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:static lg:translate-x-0",
      )}
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent" size={20} />
          <span className="text-base font-semibold tracking-tight text-text">Style Mind</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Menüyü kapat"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-text-muted hover:bg-surface-hover hover:text-text",
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors duration-150",
              isActive ? "bg-accent-muted text-accent" : "text-text-muted hover:bg-surface-hover hover:text-text",
            )
          }
        >
          <Avatar name={user?.full_name ?? "?"} src={user?.avatar_url} className="h-7 w-7 text-xs" />
          <span className="truncate">{user?.full_name}</span>
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-danger"
        >
          <LogOut size={16} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
