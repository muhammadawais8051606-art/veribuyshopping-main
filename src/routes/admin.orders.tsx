import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

type Order = {
  id: string; status: string; total: number; created_at: string; customer_id: string;
};

function AdminOrders() {
  const [items, setItems] = useState<Order[]>([]);

  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setItems((data ?? []) as Order[]));
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No orders yet.</td></tr>
          ) : items.map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
              <td className="px-4 py-3 font-mono text-xs">{o.customer_id.slice(0, 8)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 font-bold">${Number(o.total).toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground capitalize">
                  {o.status.replace(/_/g, " ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
