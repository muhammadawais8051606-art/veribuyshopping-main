import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payouts")({
  component: AdminPayouts,
});

type Ledger = {
  seller_id: string;
  online_balance: number;
  cod_owed: number;
  lifetime_earned: number;
  lifetime_commission: number;
  business_name?: string;
  account_holder?: string | null;
  iban?: string | null;
  bank_name?: string | null;
};

type Payout = {
  id: string;
  seller_id: string;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
};

function AdminPayouts() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refMap, setRefMap] = useState<Record<string, string>>({});

  const load = async () => {
    const { data: l } = await supabase.from("seller_ledger").select("*");
    const sellerIds = (l ?? []).map((x) => x.seller_id);
    const { data: sp } = sellerIds.length
      ? await supabase.from("seller_profiles").select("user_id, business_name, account_holder, iban, bank_name").in("user_id", sellerIds)
      : { data: [] as { user_id: string; business_name: string; account_holder: string | null; iban: string | null; bank_name: string | null }[] };
    const map = new Map((sp ?? []).map((s) => [s.user_id, s]));
    setLedgers((l ?? []).map((x) => {
      const s = map.get(x.seller_id);
      return { ...x, business_name: s?.business_name, account_holder: s?.account_holder, iban: s?.iban, bank_name: s?.bank_name };
    }) as Ledger[]);

    const { data: p } = await supabase.from("payouts").select("*").order("created_at", { ascending: false }).limit(50);
    setPayouts((p ?? []) as Payout[]);
  };

  useEffect(() => { load(); }, []);

  const createPayout = async (lg: Ledger) => {
    const net = Number(lg.online_balance) - Number(lg.cod_owed);
    if (net <= 0) return toast.error("Net balance is zero or negative — nothing to pay out.");
    const { error } = await supabase.from("payouts").insert({
      seller_id: lg.seller_id,
      amount: net,
      online_balance_snapshot: lg.online_balance,
      cod_owed_snapshot: lg.cod_owed,
      reference: refMap[lg.seller_id] || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Payout created (pending). Click Confirm Transfer after sending funds.");
    load();
  };

  const confirm = async (id: string) => {
    const { error } = await supabase.rpc("confirm_payout", { _payout_id: id });
    if (error) return toast.error(error.message);
    toast.success("Payout confirmed. Seller notified, balance reset.");
    load();
  };

  const totalOwed = ledgers.reduce((s, l) => s + Math.max(0, Number(l.online_balance) - Number(l.cod_owed)), 0);
  const totalCodCommission = ledgers.reduce((s, l) => s + Number(l.cod_owed), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Pending Payouts (Net)</div>
          <div className="mt-1 text-2xl font-bold">PKR {totalOwed.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">COD Commission Owed to Platform</div>
          <div className="mt-1 text-2xl font-bold text-warning">PKR {totalCodCommission.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Active Sellers</div>
          <div className="mt-1 text-2xl font-bold">{ledgers.length}</div>
        </div>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Wallet className="h-5 w-5 text-primary" /> Seller Net Balances</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-2">Seller</th><th>Online</th><th>COD owed</th><th>Net</th><th>Bank</th><th>Reference</th><th></th></tr>
            </thead>
            <tbody>
              {ledgers.map((l) => {
                const net = Number(l.online_balance) - Number(l.cod_owed);
                return (
                  <tr key={l.seller_id} className="border-t">
                    <td className="py-3">
                      <div className="font-medium">{l.business_name || l.seller_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">Earned PKR {Number(l.lifetime_earned).toFixed(0)}</div>
                    </td>
                    <td>PKR {Number(l.online_balance).toFixed(2)}</td>
                    <td className="text-warning">PKR {Number(l.cod_owed).toFixed(2)}</td>
                    <td className={`font-bold ${net > 0 ? "text-success" : "text-muted-foreground"}`}>PKR {net.toFixed(2)}</td>
                    <td className="text-xs">
                      {l.iban ? <><div>{l.bank_name}</div><div className="font-mono">{l.iban}</div></> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td>
                      <Input className="h-8 w-32" placeholder="ref/note" value={refMap[l.seller_id] ?? ""} onChange={(e) => setRefMap({ ...refMap, [l.seller_id]: e.target.value })} />
                    </td>
                    <td>
                      <Button size="sm" onClick={() => createPayout(l)} disabled={net <= 0}>Create payout</Button>
                    </td>
                  </tr>
                );
              })}
              {ledgers.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No seller balances yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Recent Payouts</h2>
        <div className="space-y-2">
          {payouts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <div>
                <div className="font-mono text-xs">{p.id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
              </div>
              <div>Seller: <span className="font-mono text-xs">{p.seller_id.slice(0, 8)}</span></div>
              <div className="font-bold">PKR {Number(p.amount).toFixed(2)}</div>
              <div className="text-xs">{p.reference}</div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                p.status === "confirmed" ? "bg-success/15 text-success" :
                p.status === "pending" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
              }`}>{p.status}</span>
              {p.status === "pending" && (
                <Button size="sm" onClick={() => confirm(p.id)} className="bg-success hover:bg-success/90 text-success-foreground">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Confirm Transfer
                </Button>
              )}
            </div>
          ))}
          {payouts.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No payouts yet.</p>}
        </div>
      </section>
    </div>
  );
}
