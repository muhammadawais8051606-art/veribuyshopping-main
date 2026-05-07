import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Banknote, DollarSign, TrendingUp, Wallet, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/seller/finance")({
  component: FinancePage,
});

type Ledger = { online_balance: number; cod_owed: number; lifetime_earned: number; lifetime_commission: number };
type Txn = { id: string; type: string; amount: number; description: string | null; created_at: string };
type Payout = { id: string; amount: number; status: string; created_at: string; confirmed_at: string | null; reference: string | null };
type SellerNotification = { id: string; message: string; created_at: string; is_read: boolean };

function FinancePage() {
  const { user, sellerScopeId, sellerTeamRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ bank_name: string | null; account_holder: string | null; iban: string | null; account_number: string | null } | null>(null);
  const [ledger, setLedger] = useState<Ledger>({ online_balance: 0, cod_owed: 0, lifetime_earned: 0, lifetime_commission: 0 });
  const [txns, setTxns] = useState<Txn[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    if (sellerTeamRole !== "owner") { navigate({ to: "/seller" }); return; }
    if (!sellerScopeId) return;
    const load = async () => {
      const [{ data: sp }, { data: l }, { data: t }, { data: p }, n] = await Promise.all([
        supabase.from("seller_profiles").select("bank_name, account_holder, iban, account_number").eq("user_id", sellerScopeId).maybeSingle(),
        supabase.from("seller_ledger").select("*").eq("seller_id", sellerScopeId).maybeSingle(),
        supabase.from("transactions").select("*").eq("seller_id", sellerScopeId).order("created_at", { ascending: false }).limit(50),
        supabase.from("payouts").select("*").eq("seller_id", sellerScopeId).order("created_at", { ascending: false }).limit(20),
        (supabase as any).from("seller_notifications").select("*").eq("seller_id", sellerScopeId).order("created_at", { ascending: false }).limit(20),
      ]);
      setProfile(sp);
      if (l) setLedger(l as Ledger);
      setTxns((t ?? []) as Txn[]);
      setPayouts((p ?? []) as Payout[]);
      setNotifications((n.data ?? []) as SellerNotification[]);
    };
    load();

    // realtime payout notifications
    const channel = supabase.channel("seller-finance-" + sellerScopeId)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payouts", filter: `seller_id=eq.${sellerScopeId}` },
        (payload) => {
          const np = payload.new as Payout;
          if (np.status === "confirmed") {
            import("sonner").then(({ toast }) => toast.success(`Payout confirmed: PKR ${Number(np.amount).toFixed(2)}`));
            load();
          }
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seller_notifications", filter: `seller_id=eq.${sellerScopeId}` },
        (payload) => {
          const note = payload.new as SellerNotification;
          import("sonner").then(({ toast }) => toast.success(note.message));
          load();
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, sellerScopeId, sellerTeamRole, navigate]);

  const net = Number(ledger.online_balance) - Number(ledger.cod_owed);

  const cards = [
    { label: "Online Balance", value: `PKR ${Number(ledger.online_balance).toFixed(2)}`, icon: Wallet, color: "text-success" },
    { label: "COD Commission Owed", value: `PKR ${Number(ledger.cod_owed).toFixed(2)}`, icon: AlertCircle, color: "text-warning" },
    { label: "Net Payable to You", value: `PKR ${net.toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
    { label: "Lifetime Earned", value: `PKR ${Number(ledger.lifetime_earned).toFixed(2)}`, icon: DollarSign, color: "text-veribuy" },
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
            <div className="mt-2 text-xl md:text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-veribuy/5 border-veribuy/30 p-4 text-sm">
        <strong>How payouts work:</strong> When customers pay online, your earnings (minus 3% platform commission) accumulate in your <em>Online Balance</em>. For COD orders, you collect the full amount yourself, but the 3% commission is added to <em>COD Owed</em>. Your <em>Net Payable</em> is what the platform owes you. Admin reviews pending payouts and confirms a manual bank transfer; you'll receive a notification here.
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2 font-semibold"><Banknote className="h-5 w-5 text-primary" /> Payout Account</div>
        {profile ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Row k="Bank" v={profile.bank_name} />
            <Row k="Account holder" v={profile.account_holder} />
            <Row k="IBAN" v={profile.iban} />
            <Row k="Account number" v={profile.account_number} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No payout account on file.</p>
        )}
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Notifications</h2>
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-lg border p-3 text-sm">
              <div>{n.message}</div>
              <div className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
          {notifications.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Payouts</h2>
        <div className="space-y-2">
          {payouts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                {p.reference && <div className="text-xs">Ref: {p.reference}</div>}
              </div>
              <div className="font-bold">PKR {Number(p.amount).toFixed(2)}</div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                p.status === "confirmed" ? "bg-success/15 text-success" :
                p.status === "pending" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
              }`}>{p.status}</span>
            </div>
          ))}
          {payouts.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No payouts yet.</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-2">When</th><th>Type</th><th>Amount</th><th>Note</th></tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="py-2 text-xs">{new Date(t.created_at).toLocaleString()}</td>
                  <td>{t.type}</td>
                  <td className={Number(t.amount) >= 0 ? "text-success" : "text-destructive"}>PKR {Number(t.amount).toFixed(2)}</td>
                  <td className="text-xs">{t.description}</td>
                </tr>
              ))}
              {txns.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v || "—"}</dd>
    </div>
  );
}
