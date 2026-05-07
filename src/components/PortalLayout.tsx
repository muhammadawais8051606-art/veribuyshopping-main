import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function PortalLayout({
  title,
  badge,
  items,
  children,
}: {
  title: string;
  badge: string;
  items: Item[];
  children: ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-secondary">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-nav text-nav-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold">VeriBuy</span>
            <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
              {badge}
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden md:inline opacity-80">{user?.email}</span>
            <Button size="sm" variant="ghost" onClick={() => signOut()} className="hover:bg-nav-accent">
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-0 px-0 md:px-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 py-6 md:block">
          <nav className="space-y-1">
            {items.map((it) => {
              const active = path === it.to || (it.to !== "/" && path.startsWith(it.to + "/"));
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                  }`}
                >
                  <it.icon className="h-4 w-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-4">
          <h1 className="mb-6 text-2xl font-bold">{title}</h1>

          {/* mobile nav */}
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {items.map((it) => {
              const active = path === it.to || (it.to !== "/" && path.startsWith(it.to + "/"));
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                    active ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                  }`}
                >
                  <it.icon className="h-3.5 w-3.5" /> {it.label}
                </Link>
              );
            })}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
