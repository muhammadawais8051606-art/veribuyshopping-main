import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/seller/orders")({
  component: SellerOrders,
});

type Item = {
  id: string; quantity: number; unit_price: number; title_snapshot: string;
  order_id: string; created_at: string;
  orders: { id: string; status: string; customer_id: string; total: number; commission_amount: number; commission_paid_by_seller: boolean; customer_full_name: string | null; customer_email: string | null; customer_phone: string | null; customer_house_street: string | null; customer_sector_area: string | null; customer_city: string | null; special_instructions: string | null; order_code: string | null; payment_method: "online" | "cod" } | null;
};

function SellerOrders() {
  const { user, sellerScopeId } = useAuth();
  const scopeId = sellerScopeId ?? user?.id ?? null;
  const [items, setItems] = useState<Item[]>([]);
  const [adminBank, setAdminBank] = useState<{ bank_name: string; account_title: string; iban: string } | null>(null);
  const [payModal, setPayModal] = useState(false);
  const [payableOrderIds, setPayableOrderIds] = useState<string[]>([]);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const load = async () => {
    if (!scopeId) return;
    const [{ data: oi }, { data: bank }] = await Promise.all([
      supabase
      .from("order_items")
      .select("id, quantity, unit_price, title_snapshot, order_id, created_at, orders(id, status, customer_id, total, commission_amount, commission_paid_by_seller, customer_full_name, customer_email, customer_phone, customer_house_street, customer_sector_area, customer_city, special_instructions, order_code, payment_method)")
      .eq("seller_id", scopeId)
      .order("created_at", { ascending: false }),
      supabase.from("platform_bank_accounts").select("bank_name, account_title, iban").eq("is_active", true).maybeSingle(),
    ]);
    setItems((oi ?? []) as Item[]);
    setAdminBank((bank as { bank_name: string; account_title: string; iban: string } | null) ?? null);
  };

  useEffect(() => {
    void load();
  }, [scopeId]);

  const uniqueOrders = Array.from(
    new Map(items.filter((it) => it.orders).map((it) => [it.order_id, it.orders!])).entries(),
  ).map(([id, order]) => ({ id, ...order }));

  const pendingCommissionOrders = uniqueOrders.filter(
    (o) => o.status === "completed" && o.payment_method === "cod" && !o.commission_paid_by_seller,
  );
  const pendingCommissionAmount = pendingCommissionOrders.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);

  const updateStatus = async (orderId: string, status: "shipped" | "awaiting_unbox_verification" | "completed") => {
    setBusyOrderId(orderId);
    const updates: Record<string, unknown> = { status };
    if (status === "completed") {
      updates.delivered_at = new Date().toISOString();
    }
    const { error } = await (supabase as any).from("orders").update(updates).eq("id", orderId);
    setBusyOrderId(null);
    if (error) return toast.error(error.message);
    toast.success("Order status updated.");
    await load();
  };

  const payCommission = async () => {
    if (payableOrderIds.length === 0) return;
    const { error } = await supabase.rpc("seller_mark_commission_paid", { _order_ids: payableOrderIds });
    if (error) return toast.error(error.message);
    toast.success("Commission payment recorded. Admin has been notified.");
    setPayModal(false);
    setPayableOrderIds([]);
    await load();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">Pending commission (delivered COD orders)</div>
            <div className="text-2xl font-bold">PKR {pendingCommissionAmount.toFixed(2)}</div>
          </div>
          <Button
            onClick={() => {
              setPayableOrderIds(pendingCommissionOrders.map((o) => o.id));
              setPayModal(true);
            }}
            disabled={pendingCommissionOrders.length === 0}
          >
            Pay Commission to Admin
          </Button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Subtotal</th>
            <th className="px-4 py-3">Commission</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No orders yet.</td></tr>
          ) : items.map((it) => (
            <tr key={it.id}>
              <td className="px-4 py-3 whitespace-nowrap">{new Date(it.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 font-mono text-xs">{it.orders?.order_code ?? it.order_id.slice(0, 8)}</td>
              <td className="px-4 py-3 text-xs">
                <div>{it.orders?.customer_full_name ?? "—"}</div>
                <div className="text-muted-foreground">{it.orders?.customer_phone ?? ""}</div>
              </td>
              <td className="px-4 py-3">{it.title_snapshot}</td>
              <td className="px-4 py-3">{it.quantity}</td>
              <td className="px-4 py-3">PKR {(Number(it.unit_price) * it.quantity).toFixed(2)}</td>
              <td className="px-4 py-3">PKR {Number(it.orders?.commission_amount ?? 0).toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground capitalize">
                  {(it.orders?.status ?? "—").replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-4 py-3">
                {it.orders?.status === "pending_payment" && (
                  <Button size="sm" disabled={busyOrderId === it.order_id} onClick={() => updateStatus(it.order_id, "shipped")}>Mark as dispatched</Button>
                )}
                {it.orders?.status === "shipped" && (
                  <Button size="sm" disabled={busyOrderId === it.order_id} onClick={() => updateStatus(it.order_id, "awaiting_unbox_verification")}>Mark out for delivery</Button>
                )}
                {it.orders?.status === "awaiting_unbox_verification" && (
                  <Button size="sm" disabled={busyOrderId === it.order_id} onClick={() => updateStatus(it.order_id, "completed")}>Mark delivered</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Dialog open={payModal} onOpenChange={setPayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay commission to admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="font-semibold">Admin Bank Account</div>
              <div>{adminBank?.bank_name ?? "VeriBuy Bank"}</div>
              <div>{adminBank?.account_title ?? "VeriBuy Admin"}</div>
              <div className="font-mono">{adminBank?.iban ?? "N/A"}</div>
            </div>
            <div className="font-semibold">Amount to pay: PKR {pendingCommissionAmount.toFixed(2)}</div>
            <Button className="w-full" onClick={payCommission}>I have paid</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
