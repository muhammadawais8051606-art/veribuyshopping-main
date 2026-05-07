import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Box, ClipboardList, Settings } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/seller/dashboard")({
  component: SellerDashboardPage,
});

function SellerDashboardPage() {
  const { user } = useAuth();
  const demoAuth = typeof window !== "undefined" && localStorage.getItem("veribuy_seller_demo_auth") === "true";
  const sellerName = useMemo(() => user?.email ?? "Demo Seller", [user]);

  if (!user && !demoAuth) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h1 className="text-xl font-semibold">Seller session required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please login to access the seller dashboard.</p>
        <Link to="/seller/login" className="mt-4 inline-block text-primary hover:underline">Go to Seller Login</Link>
      </div>
    );
  }

  const cards = [
    { label: "Total Sales", value: "PKR 245,900" },
    { label: "Active Orders", value: "46" },
    { label: "Pending Commission (3%)", value: "PKR 7,377" },
  ];

  const sidebarItems = [
    { label: "Orders", icon: ClipboardList, to: "/seller/orders" as const },
    { label: "Products", icon: Box, to: "/seller/products" as const },
    { label: "Finance", icon: BarChart3, to: "/seller/finance" as const },
    { label: "Team", icon: Settings, to: "/seller/team" as const },
  ];

  return (
    <div className="space-y-6 rounded-xl bg-white p-4">
      <header className="rounded-xl border border-[#D4AF37]/40 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-[#111827]">Seller Dashboard</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Logged in as {sellerName}. This layout is fully editable.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-[#D4AF37]/40 bg-white p-5 shadow-sm">
            <div className="text-sm text-[#6b7280]">{card.label}</div>
            <div className="mt-1 text-2xl font-bold text-[#111827]">{card.value}</div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-[#D4AF37]/40 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[#6b7280]">Sidebar</h2>
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.label}
                to={item.to as never}
                className="flex w-full items-center gap-2 rounded-lg border border-[#D4AF37]/30 px-3 py-2 text-left text-sm hover:bg-[#fff8e3]"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="rounded-xl border border-[#D4AF37]/40 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827]">Editable Workspace</h2>
          <p className="mt-2 text-sm text-[#6b7280]">
            Customize cards, charts, tables, or modules here for orders, inventory, commission analytics, and seller profile management.
          </p>
        </div>
      </section>
    </div>
  );
}
