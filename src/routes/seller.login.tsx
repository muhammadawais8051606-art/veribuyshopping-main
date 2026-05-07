import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/seller/login")({
  component: SellerLoginPage,
});

const DEFAULT_SELLER_EMAIL = "sunnykhan8053606@gmail.com";
const DEFAULT_SELLER_PASSWORD = "Awais@909";

function SellerLoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEFAULT_SELLER_EMAIL);
  const [password, setPassword] = useState(DEFAULT_SELLER_PASSWORD);
  const [busy, setBusy] = useState(false);

  // TEMP BYPASS: skip seller login UI entirely
  if (typeof window !== "undefined") {
    localStorage.setItem("veribuy_seller_demo_auth", "true");
    void navigate({ to: "/seller/dashboard" });
    return null;
  }

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);

    if (!error) {
      navigate({ to: "/seller/dashboard" });
      return;
    }

    if (email.trim().toLowerCase() === DEFAULT_SELLER_EMAIL && password === DEFAULT_SELLER_PASSWORD) {
      localStorage.setItem("veribuy_seller_demo_auth", "true");
      toast.success("Demo seller login active.");
      navigate({ to: "/seller/dashboard" });
      return;
    }

    toast.error(error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Seller Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access your VeriBuy seller dashboard.</p>
        <form onSubmit={onLogin} className="mt-6 space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          New seller? <Link to="/seller/register" className="text-primary hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
