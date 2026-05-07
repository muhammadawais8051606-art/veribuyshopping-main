import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bank-settings")({
  component: AdminBankSettingsPage,
});

function AdminBankSettingsPage() {
  const [bank, setBank] = useState({ bank_name: "", account_title: "", iban: "" });
  const [bankId, setBankId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("platform_bank_accounts").select("*").eq("is_active", true).maybeSingle();
      if (data) {
        setBank({ bank_name: data.bank_name, account_title: data.account_title, iban: data.iban });
        setBankId(data.id);
      }
    })();
  }, []);

  const save = async () => {
    if (!bankId) return;
    const { error } = await supabase.from("platform_bank_accounts").update(bank).eq("id", bankId);
    if (error) return toast.error(error.message);
    toast.success("Admin bank settings updated.");
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <h1 className="text-lg font-semibold">Admin Bank Settings</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><Label>Bank</Label><Input value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} /></div>
        <div><Label>Account Name</Label><Input value={bank.account_title} onChange={(e) => setBank({ ...bank, account_title: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Account/IBAN</Label><Input value={bank.iban} onChange={(e) => setBank({ ...bank, iban: e.target.value })} /></div>
      </div>
      <Button className="mt-4" onClick={save}>Save Details</Button>
    </div>
  );
}
