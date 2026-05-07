import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PackageCheck, ShieldCheck, Truck, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — VeriBuy" }] }),
  component: OrdersPage,
});

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  shipping_address: string | null;
  veribuy_verified_at: string | null;
  payment_method: "online" | "cod";
  order_items: { id: string; product_id: string; title_snapshot: string; quantity: number; unit_price: number }[];
};

type Bank = { bank_name: string; account_title: string; iban: string };

const STATUS_META: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending_payment: { label: "Pending payment", icon: Clock, color: "text-warning" },
  paid: { label: "Paid", icon: CheckCircle2, color: "text-success" },
  shipped: { label: "Shipped", icon: Truck, color: "text-primary" },
  awaiting_unbox_verification: { label: "Awaiting Unbox Verification", icon: ShieldCheck, color: "text-veribuy" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-success" },
  disputed: { label: "Disputed", icon: Clock, color: "text-destructive" },
  cancelled: { label: "Cancelled", icon: Clock, color: "text-muted-foreground" },
};

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bank, setBank] = useState<Bank | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/orders" } as never });
  }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    const [{ data: ords }, { data: b }] = await Promise.all([
      supabase.from("orders")
        .select("*, order_items(id, product_id, title_snapshot, quantity, unit_price)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("platform_bank_accounts").select("bank_name, account_title, iban").eq("is_active", true).maybeSingle(),
    ]);
    setOrders((ords ?? []) as Order[]);
    setBank(b as Bank | null);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const verify = async (orderId: string) => {
    setBusy(orderId);
    const { error } = await supabase.rpc("verify_order", { _order_id: orderId });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Verified! Payment released to seller.");
    load();
  };

  const dispute = async (orderId: string) => {
    setBusy(orderId);
    const { error } = await supabase.rpc("dispute_order", { _order_id: orderId });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.info("Dispute filed. Our team will review.");
    load();
  };

  const submitReview = async (orderId: string, productId: string, productTitle: string) => {
    if (reviewRating < 1) return toast.error("Please select a rating.");
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("product_reviews").upsert({
      product_id: productId,
      order_id: orderId,
      reviewer_id: user.id,
      reviewer_name: profile?.full_name || user.email || "Verified Buyer",
      rating: reviewRating,
      review_text: reviewText || null,
    }, { onConflict: "product_id,order_id,reviewer_id" });
    if (error) return toast.error(error.message);
    toast.success(`Thanks! Review submitted for ${productTitle}.`);
    setReviewOpen(null);
    setReviewRating(0);
    setReviewText("");
  };

  if (!user) return null;

  const progressFor = (status: string) => {
    const stages = ["pending", "packed", "shipped", "delivered"];
    const stageMap: Record<string, number> = {
      pending_payment: 0,
      paid: 1,
      shipped: 2,
      awaiting_unbox_verification: 2,
      completed: 3,
    };
    const active = stageMap[status] ?? 0;
    return Math.round((active / (stages.length - 1)) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">
        <h1 className="text-2xl font-bold">My Orders</h1>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-xl border bg-card py-16 text-center">
            <div className="text-lg font-semibold">No orders yet</div>
            <Button asChild className="mt-4 bg-primary hover:bg-primary-hover"><Link to="/shop">Shop now</Link></Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((o) => {
              const meta = STATUS_META[o.status] ?? STATUS_META.paid;
              const Icon = meta.icon;
              return (
                <div key={o.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Order placed</div>
                      <div className="text-sm font-medium">{new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-sm font-bold">${Number(o.total).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Order ID</div>
                      <div className="text-xs font-mono">{o.id.slice(0, 8)}</div>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${meta.color} bg-current/10`}>
                      <Icon className="h-4 w-4" /> {meta.label}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {o.order_items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
                        <span>{it.title_snapshot} × {it.quantity}</span>
                        <div className="flex items-center gap-2">
                          <span>PKR {(it.unit_price * it.quantity).toFixed(0)}</span>
                          {o.status === "completed" && (
                            <Dialog open={reviewOpen === `${o.id}-${it.id}`} onOpenChange={(open) => setReviewOpen(open ? `${o.id}-${it.id}` : null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Rate & Review</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Rate this product</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, idx) => {
                                      const val = idx + 1;
                                      return (
                                        <button key={val} type="button" onClick={() => setReviewRating(val)}>
                                          <Star className={`h-6 w-6 ${val <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <Textarea rows={4} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your product experience" />
                                  <Button onClick={() => submitReview(o.id, it.product_id, it.title_snapshot)} className="w-full bg-primary hover:bg-primary-hover">
                                    Submit Review
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Pending</span>
                      <span>Packed</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressFor(o.status)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/support" search={{ issue: o.id } as never}>Report Issue</Link>
                    </Button>
                  </div>

                  {o.status === "awaiting_unbox_verification" && (
                    <div className="mt-4 rounded-lg border-2 border-veribuy bg-veribuy/5 p-4">
                      <div className="flex items-center gap-2 font-semibold text-veribuy">
                        <PackageCheck className="h-5 w-5" /> Verify your unboxed package
                      </div>
                      <p className="mt-1 text-sm text-foreground/80">
                        Inspect the contents now. Confirm to release the payment, or file a dispute if anything's wrong.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          onClick={() => verify(o.id)}
                          disabled={busy === o.id}
                          className="bg-veribuy hover:bg-veribuy/90 text-veribuy-foreground"
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Confirm — looks good
                        </Button>
                        <Button onClick={() => dispute(o.id)} disabled={busy === o.id} variant="outline">
                          File a Dispute
                        </Button>
                      </div>
                    </div>
                  )}

                  {o.status === "completed" && o.veribuy_verified_at && (
                    <p className="mt-3 text-xs text-success">
                      ✓ Verified on {new Date(o.veribuy_verified_at).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
