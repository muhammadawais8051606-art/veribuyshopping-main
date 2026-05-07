import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import { useAddress, type CustomerAddress } from "@/lib/address-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, Trash2, ShieldCheck, Package, User as UserIcon, Edit2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — VeriBuy" }] }),
  component: ProfilePage,
});

// We use CustomerAddress from address-context
type Address = CustomerAddress;

type Order = { id: string; status: string; total: number; created_at: string };

const statusBadge: Record<string, string> = {
  pending_payment: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  shipped: "bg-primary/15 text-primary",
  awaiting_unbox_verification: "bg-veribuy/15 text-veribuy",
  completed: "bg-success/15 text-success",
  disputed: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted-foreground/15 text-muted-foreground",
};

function ProfilePage() {
  const { user, loading } = useAuth();
  const { addresses, refreshAddresses, setDefaultAddress } = useAddress();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; email: string; whatsapp_number: string | null } | null>(null);
  const [whatsApp, setWhatsApp] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [addressTable, setAddressTable] = useState("customer_addresses");

  useEffect(() => {
    (async () => {
      const addressesProbe = await supabase.from("addresses").select("id").limit(1);
      if (!addressesProbe.error) setAddressTable("addresses");
      else setAddressTable("customer_addresses");
    })();
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/profile" } as never });
  }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    const [p, o] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("orders").select("id, status, total, created_at").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);
    if (p.data) {
      const row = p.data as { full_name?: string | null; email?: string | null; whatsapp_number?: string | null };
      setProfile({
        full_name: row.full_name ?? "",
        email: row.email ?? user.email ?? "",
        whatsapp_number: row.whatsapp_number ?? "",
      });
      setWhatsApp(row.whatsapp_number ?? "");
      setFullName(row.full_name ?? "");
      setEmailInput(row.email ?? user.email ?? "");
    }
    setOrders((o.data ?? []).map(row => ({
      id: row.id,
      status: row.status,
      total: Number(row.total),
      created_at: row.created_at
    })) as Order[]);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user, addressTable]);

  const saveWhatsApp = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ whatsapp_number: whatsApp || null } as never).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("WhatsApp number updated");
    load();
  };

  const saveAccountSettings = async () => {
    if (!user) return;
    const currentEmail = user.email ?? "";
    const nextEmail = emailInput.trim();
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, email: nextEmail || null } as never)
      .eq("id", user.id);
    if (pErr) return toast.error(pErr.message);
    if (nextEmail && nextEmail !== currentEmail) {
      const { error: authErr } = await supabase.auth.updateUser({ email: nextEmail });
      if (authErr) return toast.error(authErr.message);
      toast.success("Profile updated. Check your new email for verification.");
    } else {
      toast.success("Account settings updated.");
    }
    load();
  };

  const saveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    const payload = {
      user_id: user.id,
      label: String(f.get("label") || "Home"),
      full_name: String(f.get("full_name") || ""),
      phone: String(f.get("phone") || ""),
      house_number: String(f.get("house_number") || ""),
      street: String(f.get("street") || ""),
      sector: String(f.get("sector") || ""),
      line1: String(f.get("line1") || ""),
      line2: String(f.get("line2") || ""),
      city: String(f.get("city") || ""),
      state: String(f.get("state") || ""),
      postal_code: String(f.get("postal_code") || ""),
      country: String(f.get("country") || "Pakistan"),
      is_default: f.get("is_default") === "on",
    };
    if (payload.is_default) {
      await supabase.from(addressTable).update({ is_default: false }).eq("user_id", user.id);
    }
    const op = editing
      ? supabase.from(addressTable).update(payload as never).eq("id", editing.id)
      : supabase.from(addressTable).insert(payload as never);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Address saved");
    await refreshAddresses();
    setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(addressTable).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const setDefault = async (id: string) => {
    await setDefaultAddress(id);
    load();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
            <p className="text-sm text-muted-foreground">{profile?.full_name || user.email}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-veribuy/10 px-3 py-1.5 text-sm font-medium text-veribuy">
            <ShieldCheck className="h-4 w-4" /> VeriBuy Protected
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Addresses */}
            <section className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5 text-primary" /> Saved Addresses</h2>
                <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary-hover"><Plus className="mr-1 h-4 w-4" />Add</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editing ? "Edit address" : "New address"}</DialogTitle></DialogHeader>
                    <form onSubmit={saveAddress} className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <Label htmlFor="label" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Label</Label>
                        <Input id="label" name="label" className="mt-1" defaultValue={editing?.label ?? "Home"} placeholder="e.g. Home, Office" />
                      </div>
                      <div className="sm:col-span-1">
                        <Label htmlFor="full_name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</Label>
                        <Input id="full_name" name="full_name" required className="mt-1" defaultValue={editing?.full_name ?? profile?.full_name ?? ""} placeholder="Receiver name" />
                      </div>
                      <div className="sm:col-span-1">
                        <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                        <Input id="phone" name="phone" className="mt-1" defaultValue={editing?.phone ?? ""} placeholder="+92 3xx xxxxxxx" />
                      </div>
                      <div className="sm:col-span-1">
                        <Label htmlFor="country" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</Label>
                        <Input id="country" name="country" className="mt-1" defaultValue={editing?.country ?? "Pakistan"} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                        <div>
                          <Label htmlFor="house_number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">House #</Label>
                          <Input id="house_number" name="house_number" className="mt-1" defaultValue={editing?.house_number ?? ""} />
                        </div>
                        <div>
                          <Label htmlFor="street" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Street / Road</Label>
                          <Input id="street" name="street" className="mt-1" defaultValue={editing?.street ?? ""} />
                        </div>
                      </div>

                      <div className="sm:col-span-1">
                        <Label htmlFor="line1" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address line 1</Label>
                        <Input id="line1" name="line1" required className="mt-1" defaultValue={editing?.line1 ?? ""} placeholder="Area, complex, etc." />
                      </div>
                      <div className="sm:col-span-1">
                        <Label htmlFor="line2" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address line 2 (Optional)</Label>
                        <Input id="line2" name="line2" className="mt-1" defaultValue={editing?.line2 ?? ""} placeholder="Apt, Suite, Floor" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                        <div>
                          <Label htmlFor="sector" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sector/Area</Label>
                          <Input id="sector" name="sector" className="mt-1" defaultValue={editing?.sector ?? ""} />
                        </div>
                        <div>
                          <Label htmlFor="city" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</Label>
                          <Input id="city" name="city" required className="mt-1" defaultValue={editing?.city ?? ""} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                        <div>
                          <Label htmlFor="state" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Province / State</Label>
                          <Input id="state" name="state" className="mt-1" defaultValue={editing?.state ?? ""} />
                        </div>
                        <div>
                          <Label htmlFor="postal_code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Postal Code</Label>
                          <Input id="postal_code" name="postal_code" className="mt-1" defaultValue={editing?.postal_code ?? ""} />
                        </div>
                      </div>

                      <div className="sm:col-span-2 mt-1 flex items-center justify-between gap-4 border-t pt-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                          <input 
                            type="checkbox" 
                            name="is_default" 
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            defaultChecked={editing?.is_default ?? addresses.length === 0} 
                          /> 
                          Default address
                        </label>
                        <Button type="submit" className="bg-[#0A192F] hover:bg-[#0A192F]/90 text-[#D4AF37] font-bold px-6 shadow-lg">
                          {editing ? "Update Address" : "Save Address"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {addresses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No addresses yet — add one to speed up checkout.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <div key={a.id} className={`rounded-xl border p-4 ${a.is_default ? "border-primary bg-primary/5" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {a.label}
                            {a.is_default && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">DEFAULT</span>}
                          </div>
                          <div className="mt-1 text-sm">{a.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[a.house_number, a.street, a.sector].filter(Boolean).join(", ")}
                          </div>
                          <div className="text-xs text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
                          <div className="text-xs text-muted-foreground">{a.city}{a.state ? `, ${a.state}` : ""} {a.postal_code}</div>
                          <div className="text-xs text-muted-foreground">{a.country} · {a.phone}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => { setEditing(a); setOpen(true); }} className="text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      {!a.is_default && (
                        <button onClick={() => setDefault(a.id)} className="mt-2 text-xs text-primary hover:underline">Set as default</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent orders + tracking */}
            <section className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><Package className="h-5 w-5 text-primary" /> Recent Orders</h2>
                <Link to="/orders" className="text-sm text-primary hover:underline">View all →</Link>
              </div>
              {orders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <Link key={o.id} to="/orders" className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">Order #{o.id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[o.status] ?? "bg-muted text-muted-foreground"}`}>
                          {o.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-bold">PKR {Number(o.total).toFixed(0)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl border bg-gradient-to-br from-veribuy/10 to-primary/5 p-5">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-5 w-5 text-veribuy" /> VeriBuy Unbox Protocol
              </div>
              <p className="mt-2 text-sm text-foreground/80">
                Pay only after you've unboxed and verified your delivery. Funds stay protected until you confirm.
              </p>
              <Button asChild className="mt-3 w-full bg-veribuy hover:bg-veribuy/90 text-veribuy-foreground">
                <Link to="/orders">Open my orders</Link>
              </Button>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 font-semibold"><UserIcon className="h-5 w-5 text-primary" /> Account</div>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <Label htmlFor="acc_name">Name</Label>
                  <Input id="acc_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="acc_email">Email</Label>
                  <Input id="acc_email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="wa_no">WhatsApp Number for Delivery</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="wa_no"
                      value={whatsApp}
                      onChange={(e) => setWhatsApp(e.target.value)}
                      placeholder="+92 3xx xxxxxxx"
                    />
                    <Button type="button" onClick={saveWhatsApp}>Save WA</Button>
                  </div>
                </div>
                <Button type="button" className="w-full" onClick={saveAccountSettings}>Save Account Settings</Button>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-5 text-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-success" /> Need to sell?</div>
              <p className="text-muted-foreground">Apply to become a verified seller and reach VeriBuy customers.</p>
              <Button asChild variant="outline" className="mt-3 w-full"><Link to="/become-seller">Become a seller</Link></Button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
