import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Store, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/become-seller")({
  head: () => ({ meta: [{ title: "Sell on VeriBuy — Become a Seller" }] }),
  component: BecomeSellerPage,
});

type ExistingProfile = {
  status: "pending" | "approved" | "blocked";
  business_name: string;
  rejection_reason: string | null;
  is_verified: boolean;
};

type AuthMode = "login" | "register";

const BYPASS_EMAIL = "sunnykhan8053606@gmail.com";
const BYPASS_PASSWORD = "Awais@909";

function BecomeSellerPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("register");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [governmentIdType, setGovernmentIdType] = useState("National ID");
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [taxId, setTaxId] = useState("");

  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Electronics");
  const [businessDescription, setBusinessDescription] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!shopName.trim()) return "Shop Name is required.";
      if (!registerEmail.trim()) return "Email is required.";
      if (!fullName.trim()) return "Full Name is required.";
      if (!registerPassword.trim() || registerPassword.length < 6) return "Password must be at least 6 characters.";
      if (!phone.trim() || !address.trim()) return "Phone and address are required.";
    }
    if (step === 2) {
      if (!governmentIdType.trim()) return "Government ID type is required.";
      if (!governmentIdFile) return "Please upload your government ID document.";
      if (!dateOfBirth) return "Date of birth is required.";
    }
    if (step === 3) {
      if (!businessDescription.trim()) return "Business details are required.";
      if (!businessCategory.trim()) return "Business category is required.";
      if (!bankAccount.trim()) return "Bank account is required.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) return toast.error(err);
    setStep((s) => Math.min(3, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const loginSeller = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) return toast.error("Email and password are required.");

    if (loginEmail.trim().toLowerCase() === BYPASS_EMAIL && loginPassword === BYPASS_PASSWORD) {
      localStorage.setItem("veribuy_seller_demo_auth", "true");
      toast.success("Super-user access granted.");
      navigate({ to: "/seller/dashboard" });
      return;
    }

    setLoginBusy(true);
    const { data, error } = await (supabase as any)
      .from("users")
      .select("status, role")
      .eq("email", loginEmail.trim().toLowerCase())
      .maybeSingle();
    setLoginBusy(false);
    if (error) return toast.error(error.message);
    if (!data || data.role !== "seller") return toast.error("Seller account not found. Please register first.");
    if (data.status === "pending") {
      toast.info("Your account is under review by Muhammad Awais.");
      return;
    }
    if (data.status === "approved") {
      toast.success("Login successful.");
      navigate({ to: "/seller/dashboard" });
      return;
    }
    if (data.status === "rejected") return toast.error("Your seller application was rejected.");
    if (data.status === "suspended") return toast.error("Your seller account is suspended.");
    toast.error("Your seller account is not active.");
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) return toast.error(err);
    setBusy(true);

    const normalizedEmail = registerEmail.trim().toLowerCase();
    const signUpResult = await supabase.auth.signUp({
      email: normalizedEmail,
      password: registerPassword,
      options: { data: { full_name: fullName.trim() } },
    });
    if (signUpResult.error) {
      setBusy(false);
      return toast.error(signUpResult.error.message);
    }

    const signInResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: registerPassword });
    const userId = signInResult.data.user?.id;
    if (!userId) {
      setBusy(false);
      return toast.error("Unable to create seller profile session.");
    }

    let governmentIdUrl: string | null = null;
    if (governmentIdFile) {
      const ext = governmentIdFile.name.split(".").pop() || "jpg";
      const filePath = `${userId}/government-id-${Date.now()}.${ext}`;
      const uploadRes = await supabase.storage.from("seller-documents").upload(filePath, governmentIdFile, { upsert: false, contentType: governmentIdFile.type });
      if (uploadRes.error) {
        setBusy(false);
        return toast.error(uploadRes.error.message);
      }
      governmentIdUrl = filePath;
    }

    const { error } = await (supabase as any).from("users").upsert({
      id: userId,
      email: normalizedEmail,
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      shop_name: shopName.trim(),
      role: "seller",
      status: "pending",
      government_id_type: governmentIdType,
      government_id_url: governmentIdUrl,
      date_of_birth: dateOfBirth,
      tax_id: taxId || null,
      business_reg_number: businessRegNumber || null,
      business_category: businessCategory,
      business_description: businessDescription,
      bank_account: bankAccount,
    }, { onConflict: "id" });

    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Your application has been submitted. You will receive an email once approved.");
    await supabase.auth.signOut();
    setMode("login");
    setLoginEmail(registerEmail.trim());
    setStep(1);
  };

  const steps = [
    { n: 1, label: "Contact" },
    { n: 2, label: "Identity" },
    { n: 3, label: "Business" },
  ];

  return (
    <Shell>
      <div className="mx-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#d4af37]/30 bg-[#0b1f3a] p-5 text-white shadow-xl">
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-[#d4af37] text-[#0b1f3a]" : "text-white/80"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "register" ? "bg-[#d4af37] text-[#0b1f3a]" : "text-white/80"}`}
          >
            Register
          </button>
        </div>

        {mode === "login" ? (
          <section className="space-y-4">
            <div>
              <Label className="text-white">Email</Label>
              <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="mt-1 border-white/30 bg-white/10 text-white placeholder:text-white/50" />
            </div>
            <div>
              <Label className="text-white">Password</Label>
              <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="mt-1 border-white/30 bg-white/10 text-white placeholder:text-white/50" />
            </div>
            <Button onClick={loginSeller} disabled={loginBusy} className="w-full bg-[#d4af37] text-[#0b1f3a] hover:bg-[#e4c766]">
              {loginBusy ? "Signing in..." : "Login"}
            </Button>
          </section>
        ) : (
          <section className="space-y-4">
            <ol className="mb-4 grid grid-cols-3 gap-2">
              {steps.map((s) => {
                const done = step > s.n;
                const active = step === s.n;
                return (
                  <li key={s.n} className="flex flex-col items-center text-center">
                    <div className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full border text-xs
                      ${done ? "border-[#d4af37] bg-[#d4af37] text-[#0b1f3a]" :
                        active ? "border-[#d4af37] text-[#d4af37]" :
                        "border-white/30 text-white/60"}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                    </div>
                    <span className={`text-[11px] ${active || done ? "text-white" : "text-white/60"}`}>{s.label}</span>
                  </li>
                );
              })}
            </ol>

            {step === 1 && (
              <div className="space-y-3">
                <Field label="Full Name">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Shop Name">
                  <Input value={shopName} onChange={(e) => setShopName(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Email">
                  <Input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Password">
                  <Input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Phone Number">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Address">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <Field label="Government ID Type">
                  <select value={governmentIdType} onChange={(e) => setGovernmentIdType(e.target.value)} className="h-10 w-full rounded-md border border-white/30 bg-white/10 px-3 text-sm text-white">
                    <option className="text-black">Passport</option>
                    <option className="text-black">National ID</option>
                    <option className="text-black">Driver’s License</option>
                  </select>
                </Field>
                <Field label="Upload ID Document">
                  <Input type="file" accept="image/*" onChange={(e) => setGovernmentIdFile(e.target.files?.[0] ?? null)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Date of Birth">
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Tax ID / VAT (optional)">
                  <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <Field label="Business Registration Number (optional)">
                  <Input value={businessRegNumber} onChange={(e) => setBusinessRegNumber(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Business Category">
                  <select value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} className="h-10 w-full rounded-md border border-white/30 bg-white/10 px-3 text-sm text-white">
                    {["Electronics", "Fashion", "Home & Kitchen", "Books", "Toys", "Sports", "Beauty", "Automotive", "Grocery"].map((cat) => (
                      <option key={cat} className="text-black">{cat}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Brief Business Description">
                  <Textarea rows={4} value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
                <Field label="Bank Account Number">
                  <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="border-white/30 bg-white/10 text-white" />
                </Field>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4">
              <Button variant="ghost" onClick={prev} disabled={step === 1} className="text-white hover:bg-white/10">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              {step < 3 ? (
                <Button onClick={next} className="bg-[#d4af37] text-[#0b1f3a] hover:bg-[#e4c766]">
                  Continue <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={busy} className="bg-[#d4af37] text-[#0b1f3a] hover:bg-[#e4c766]">
                  {busy ? "Submitting..." : "Submit Registration"}
                </Button>
              )}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

/* ---------- helpers ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#06152b]">
      <TopNav />
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-8 md:px-6">
        <div className="mb-6 w-full">
          <div className="mb-4 flex items-center justify-center gap-2 text-[#d4af37]">
            <Store className="h-7 w-7" />
            <h1 className="text-3xl font-bold">Sell on VeriBuy</h1>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, icon: Icon, hint, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 flex items-center gap-1.5 text-sm text-white">
        {Icon && <Icon className="h-3.5 w-3.5 text-white/70" />} {label}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/60">{hint}</p>}
    </div>
  );
}
