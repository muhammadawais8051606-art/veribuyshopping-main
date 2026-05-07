import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/seller/")({
  component: SellerDashboard,
});

function SellerDashboard() {
  const { user, sellerScopeId, sellerTeamRole } = useAuth();
  const scopeId = sellerScopeId ?? user?.id ?? null;
  const isOwner = sellerTeamRole === "owner";
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [chartData, setChartData] = useState<{ day: string; revenue: number }[]>([]);

  useEffect(() => {
    if (!scopeId) return;
    (async () => {
      const [{ count: prodCount }, { data: items }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", scopeId),
        supabase.from("order_items").select("unit_price, quantity, created_at, order_id, orders(status)").eq("seller_id", scopeId),
      ]);

      const myItems = (items ?? []) as { unit_price: number; quantity: number; created_at: string; order_id: string; orders: { status: string } | null }[];
      const revenue = myItems
        .filter((i) => i.orders?.status === "completed")
        .reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
      const orderIds = new Set(myItems.map((i) => i.order_id));
      const pending = myItems.filter((i) => i.orders?.status === "awaiting_unbox_verification").length;

      setStats({ products: prodCount ?? 0, orders: orderIds.size, revenue, pending });

      // last 7 days revenue
      const now = new Date();
      const map = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        map.set(d.toISOString().slice(0, 10), 0);
      }
      myItems.forEach((it) => {
        const k = it.created_at.slice(0, 10);
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + Number(it.unit_price) * it.quantity);
      });
      setChartData([...map.entries()].map(([day, revenue]) => ({ day: day.slice(5), revenue })));
    })();
  }, [scopeId]);

  const cards = [
    ...(isOwner ? [{ label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-success" }] : []),
    { label: "Orders", value: stats.orders, icon: ShoppingBag, color: "text-primary" },
    { label: "Products Listed", value: stats.products, icon: Package, color: "text-veribuy" },
    { label: "Awaiting Verification", value: stats.pending, icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="mt-2 text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      {isOwner && (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Revenue — Last 7 days</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}
    </div>
  );
}
