import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalLayout } from "@/components/PortalLayout";
import { LayoutDashboard, Users, Tag, ShoppingBag, Banknote, Wallet } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function NotFoundGhost() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
    </div>
  );
}

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/sellers", label: "Sellers", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/orders", label: "All Orders", icon: ShoppingBag },
  { to: "/admin/payouts", label: "Payouts", icon: Wallet },
  { to: "/admin/finance", label: "Finance", icon: Banknote },
  { to: "/admin/bank-settings", label: "Bank Settings", icon: Banknote },
];

function AdminLayout() {
  return (
    <PortalLayout title="Super Admin Panel" badge="Admin" items={items}>
      <Outlet />
    </PortalLayout>
  );
}
