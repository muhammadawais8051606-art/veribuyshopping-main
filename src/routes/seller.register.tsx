import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/seller/register")({
  component: SellerRegisterPage,
});

function SellerRegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    businessName: "",
    description: "",
    bankName: "",
    accountHolder: "",
    iban: "",
    accountNumber: "",
  });

  // TEMP BYPASS: skip seller register UI entirely
  if (typeof window !== "undefined") {
    localStorage.setItem("veribuy_seller_demo_auth", "true");
    void navigate({ to: "/seller/dashboard" });
    return null;
  }

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    setBusy(true);
    const { error } = await signUp(form.email, form.password, form.fullName);
    if (error) {
      setBusy(false);
      toast.error(error);
      return;
    }

    const { data: signInResult } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    const userId = signInResult.user?.id;
    if (userId) {
      await supabase.from("seller_profiles").upsert({
        user_id: userId,
        business_name: form.businessName || form.fullName,
        description: form.description || null,
        bank_name: form.bankName || null,
        account_holder: form.accountHolder || null,
        iban: form.iban || null,
        account_number: form.accountNumber || null,
      } as never).then(() => null, () => null);
    }

    setBusy(false);
    toast.success("Seller registration submitted.");
    navigate({ to: "/seller/login" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Seller Registration</h1>
        <p className="mt-1 text-sm text-muted-foreground">Step {step} of 3 - Join VeriBuy Marketplace</p>

        {step === 1 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div><Label>Full Name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 grid gap-4">
            <div><Label>Business Name</Label><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></div>
            <div><Label>Business Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div><Label>Bank Name</Label><Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} /></div>
            <div><Label>Account Holder</Label><Input value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} /></div>
            <div><Label>IBAN</Label><Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} /></div>
            <div><Label>Account Number</Label><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /></div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 1}>Back</Button>
          {step < 3 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} disabled={busy}>{busy ? "Submitting..." : "Submit Registration"}</Button>
          )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Already registered? <Link to="/seller/login" className="text-primary hover:underline">Go to login</Link>
        </p>
      </div>
    </div>
  );
}
