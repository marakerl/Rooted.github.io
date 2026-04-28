import { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, Utensils, HeartPulse, Sprout, TrendingDown, Download, LogOut, Leaf } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Today", icon: Home, end: true },
  { to: "/log-meal", label: "Log meal", icon: Utensils },
  { to: "/checkin", label: "Check-in", icon: HeartPulse },
  { to: "/foods", label: "Foods", icon: Sprout },
  { to: "/insights", label: "Insights", icon: TrendingDown },
  { to: "/export", label: "Export", icon: Download },
];

export const Layout = ({ children }: { children?: ReactNode }) => {
  const { signOut, user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 md:min-h-screen md:border-r border-border bg-card/60 backdrop-blur-sm md:sticky md:top-0">
        <div className="p-5 flex items-center gap-2 border-b border-border md:border-b-0">
          <div className="h-9 w-9 rounded-full bg-gradient-leaf flex items-center justify-center shadow-leaf">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold leading-none">Rooted</h1>
            <p className="text-xs text-muted-foreground mt-0.5">food & gut journal</p>
          </div>
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-3 gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block p-3 mt-auto border-t border-border">
          <p className="text-xs text-muted-foreground px-2 mb-2 truncate">{user?.email}</p>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-5 md:p-10 max-w-5xl mx-auto w-full animate-fade-in">
        {children ?? <Outlet />}
      </main>
    </div>
  );
};
