import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Search = { mode?: "signup" | "signin"; redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "signup" ? "signup" : "signin",
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "VeriBuy Login & Register" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { signIn, signUp, user, loading, roles, sellerScopeId, isSuperAdmin } = useAuth();
  const [view, setView] = useState<"signin" | "signup">(mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    void routeByRoleAndStatus(redirect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, redirect, roles, sellerScopeId, isSuperAdmin]);

  const routeByRoleAndStatus = async (redirectTo?: string) => {
    if (redirectTo) {
      navigate({ to: redirectTo });
      return;
    }

    if (isSuperAdmin || roles.includes("admin")) {
      navigate({ to: "/admin" });
      return;
    }
    if (roles.includes("seller")) {
      if (sellerScopeId) navigate({ to: "/seller/dashboard" });
      else toast.info("Your seller account is awaiting admin approval.");
      return;
    }
    navigate({ to: "/" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    if (view === "signup") {
      if (!fullName.trim() || !phone.trim() || !address.trim()) {
        setBusy(false);
        toast.error("Please complete all required fields.");
        return;
      }
      if (password.length < 6 || password !== confirmPassword) {
        setBusy(false);
        toast.error("Passwords must match and be at least 6 characters.");
        return;
      }

      const { error } = await signUp(normalizedEmail, password, fullName.trim());
      if (error) {
        setBusy(false);
        toast.error(error);
        return;
      }

      const { data: signInRes, error: signInErr } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInErr || !signInRes.user) {
        setBusy(false);
        toast.error(signInErr?.message ?? "Could not complete login after signup.");
        return;
      }

      setBusy(false);
      toast.success("Account created. Welcome to VeriBuy.");
      navigate({ to: "/" });
      return;
    }

    const { error } = await signIn(normalizedEmail, password);
    setBusy(false);
    if (error) return toast.error(error);

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (!uid) return;
    await routeByRoleAndStatus(redirect);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/40 bg-white p-6 sm:p-8 shadow-lg">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <ShieldCheck className="h-7 w-7 text-[#D4AF37]" />
          <span className="text-2xl font-bold text-[#111827]">VeriBuy</span>
        </Link>
        <h1 className="text-2xl font-bold text-[#111827]">
          {view === "signup" ? "Create Account" : "Sign In"}
        </h1>
        <p className="mt-1 text-sm text-[#6b7280]">{view === "signup" ? "Create your buyer account." : "Welcome back to VeriBuy."}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {view === "signup" && (
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1" />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </div>
          {view === "signup" && (
            <>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required className="mt-1" />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1" />
          </div>
          {view === "signup" && (
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="mt-1" />
            </div>
          )}
          <Button disabled={busy} type="submit" className="w-full bg-[#D4AF37] text-white hover:bg-[#c39e30]">
            {busy ? "Please wait..." : view === "signup" ? "Register" : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm">
          {view === "signin" && (
            <>
              <div>
                <button onClick={() => setView("signup")} className="text-[#D4AF37] hover:underline">
                  New to VeriBuy? Create account
                </button>
              </div>
            </>
          )}
          {view === "signup" && (
            <button onClick={() => setView("signin")} className="text-[#D4AF37] hover:underline">
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
