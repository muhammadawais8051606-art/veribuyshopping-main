import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { PLATFORM_COMMISSION_RATE, VERIBUY_BANK_DETAILS } from "@/lib/platform-config";

export const Route = createFileRoute("/admin/finance")({
  component: AdminFinance,
});

type Bank = { id: string; bank_name: string; account_title: string; iban: string; is_active: boolean };

function AdminFinance() {
  const [bank, setBank] = useState<Bank | null>(null);
  const [txns, setTxns] = useState<{ id: string; seller_id: string; type: string; amount: number; description: string | null; created_at: string }[]>([]);

  const load = async () => {
    const { data: b } = await supabase.from("platform_bank_accounts").select("*").eq("is_active", true).maybeSingle();
    if (b) setBank(b as Bank);
    const { data: t } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100);
    setTxns((t ?? []) as typeof txns);
  };
  useEffect(() => { load(); }, []);

  const saveBank = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bank) return;
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("platform_bank_accounts").update({
      bank_name: String(f.get("bank_name")), account_title: String(f.get("account_title")), iban: String(f.get("iban")),
    }).eq("id", bank.id);
    if (error) return toast.error(error.message);
    toast.success("Bank details updated"); load();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Banknote className="h-5 w-5 text-primary" /> Platform Bank Account</h2>
        {bank && (
          <form onSubmit={saveBank} className="grid gap-3 sm:grid-cols-2">
            <div><Label>Bank name</Label><Input name="bank_name" defaultValue={bank.bank_name || VERIBUY_BANK_DETAILS.bankName} /></div>
            <div><Label>Account title</Label><Input name="account_title" defaultValue={bank.account_title || VERIBUY_BANK_DETAILS.accountTitle} /></div>
            <div className="sm:col-span-2"><Label>IBAN</Label><Input name="iban" defaultValue={bank.iban || VERIBUY_BANK_DETAILS.iban} className="font-mono" /></div>
            <Button type="submit" className="bg-primary hover:bg-primary-hover">Save</Button>
          </form>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Commission Rate (Locked)</h2>
        <div className="rounded-lg border bg-secondary p-4 text-sm">
          <div className="font-semibold">Platform commission is fixed at {(PLATFORM_COMMISSION_RATE * 100).toFixed(0)}%</div>
          <div className="mt-1 text-muted-foreground">
            This rate is hard-enforced in payout and completion logic.
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">All Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-2">When</th><th>Seller</th><th>Type</th><th>Amount (PKR)</th><th>Description</th></tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="py-2 text-xs">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="font-mono text-xs">{t.seller_id.slice(0, 8)}</td>
                  <td>{t.type}</td>
                  <td className={Number(t.amount) >= 0 ? "text-success" : "text-destructive"}>{Number(t.amount).toFixed(2)}</td>
                  <td className="text-xs">{t.description}</td>
                </tr>
              ))}
              {txns.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
