import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { PortalLayout } from "@/components/PortalLayout";
import { LayoutDashboard, Package, ShoppingBag, Users, Banknote } from "lucide-react";

export const Route = createFileRoute("/seller")({
  component: SellerLayout,
});

function SellerLayout() {
  // TEMP BYPASS MODE: always show Seller Central (no auth gating)
  const { sellerTeamRole } = useAuth();
  const isOwner = sellerTeamRole === "owner";

  const items = [
    { to: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/seller/products", label: "Products", icon: Package },
    { to: "/seller/orders", label: "Orders", icon: ShoppingBag },
    ...(isOwner ? [
      { to: "/seller/finance", label: "Finance", icon: Banknote },
      { to: "/seller/team", label: "Team", icon: Users },
    ] : []),
  ];

  return (
    <PortalLayout title="Seller Central" badge={isOwner ? "Owner" : "Operations"} items={items}>
      <Outlet />
    </PortalLayout>
  );
}
