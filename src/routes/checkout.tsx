import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, CreditCard, Truck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PLATFORM_COMMISSION_RATE } from "@/lib/platform-config";

export const Route = createFileRoute("/checkout")({
  validateSearch: (s: Record<string, unknown>) => ({
    buyNow: typeof s.buyNow === "string" ? s.buyNow : undefined,
    quick: s.quick === "1" ? "1" : undefined,
  }),
  head: () => ({ meta: [{ title: "Checkout — VeriBuy" }] }),
  component: CheckoutPage,
});

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  houseStreet: string;
  sectorArea: string;
  city: string;
  specialInstructions: string;
};

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { buyNow, quick } = useSearch({ from: "/checkout" });
  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    email: user?.email ?? "",
    phone: "",
    houseStreet: "",
    sectorArea: "",
    city: "",
    specialInstructions: "",
  });
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [placedOrderCode, setPlacedOrderCode] = useState("");
  const [buyNowItem, setBuyNowItem] = useState<{ product_id: string; seller_id: string; title: string; price: number; quantity: number } | null>(null);
  const [quickPlaced, setQuickPlaced] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, email: prev.email || user.email || "" }));
  }, [user]);

  useEffect(() => {
    if (!buyNow) {
      setBuyNowItem(null);
      return;
    }
    (async () => {
      const { data } = await supabase.from("products").select("id, seller_id, title, price").eq("id", buyNow).maybeSingle();
      if (data) {
        setBuyNowItem({
          product_id: data.id,
          seller_id: data.seller_id,
          title: data.title,
          price: Number(data.price),
          quantity: 1,
        });
      } else {
        setBuyNowItem(null);
      }
    })();
  }, [buyNow]);

  if (!user) return null;
  const checkoutItems = buyNowItem ? [buyNowItem] : items;
  const checkoutTotal = checkoutItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  if (checkoutItems.length === 0)
    return (
      <div className="min-h-screen bg-background"><TopNav />
        <div className="p-12 text-center text-muted-foreground">Your cart is empty.</div>
      </div>
    );

  const shippingAddress = useMemo(
    () => `${form.fullName}, ${form.houseStreet}, ${form.sectorArea}, ${form.city}, ${form.phone}, ${form.email}`,
    [form],
  );

  const commissionAmount = useMemo(() => Number((checkoutTotal * PLATFORM_COMMISSION_RATE).toFixed(2)), [checkoutTotal]);
  const orderCode = () => `VERI${Date.now().toString().slice(-10)}`;

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitOrder();
  };

  const submitOrder = async () => {
    const requiredMissing = !form.fullName || !form.email || !form.phone || !form.houseStreet || !form.sectorArea || !form.city;
    if (requiredMissing) {
      toast.error("Please fill all required address fields.");
      return;
    }

    setBusy(true);
    try {
      const generatedCode = orderCode();
      const { data: order, error: oErr } = await supabase.from("orders").insert({
        customer_id: user.id,
        status: "pending_payment",
        total: checkoutTotal,
        shipping_address: shippingAddress,
        payment_method: "cod",
        order_code: generatedCode,
        customer_full_name: form.fullName,
        customer_email: form.email,
        customer_phone: form.phone,
        customer_house_street: form.houseStreet,
        customer_sector_area: form.sectorArea,
        customer_city: form.city,
        special_instructions: form.specialInstructions || null,
        commission_amount: commissionAmount,
        commission_paid_by_seller: false,
      }).select().single();
      if (oErr) throw oErr;

      const itemsToInsert = checkoutItems.map((it) => ({
        order_id: order.id, product_id: it.product_id, seller_id: it.seller_id,
        title_snapshot: it.title, unit_price: it.price, quantity: it.quantity,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(itemsToInsert);
      if (iErr) throw iErr;

      // COD + open-box flow starts from seller dispatch lifecycle.
      await supabase.from("orders").update({ status: "pending_payment" }).eq("id", order.id);

      for (const it of checkoutItems) {
        const { data: p } = await supabase.from("products").select("stock").eq("id", it.product_id).single();
        if (p) await supabase.from("products").update({ stock: Math.max(0, p.stock - it.quantity) }).eq("id", it.product_id);
      }

      const lines = checkoutItems.map((it) => `${it.title} (x${it.quantity})`).join(", ");
      await Promise.all(
        checkoutItems.map((it) =>
          (supabase as any).from("seller_notifications").insert({
            seller_id: it.seller_id,
            message: `You have a new order #${generatedCode} from ${form.fullName}. Prepare for open-box delivery. Items: ${lines}`,
          }).then(() => null, () => null),
        ),
      );

      if (!buyNowItem) clear();
      setPlacedOrderCode(generatedCode);
      setSuccessOpen(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (quick !== "1" || !buyNowItem || quickPlaced || busy) return;
    setQuickPlaced(true);
  }, [quick, buyNowItem, quickPlaced, busy]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
        <form onSubmit={placeOrder} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-xl border bg-card p-5 sm:p-6">
              <h2 className="font-semibold">Delivery Details</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><Label>Full Name *</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>House/Street *</Label><Input value={form.houseStreet} onChange={(e) => setForm({ ...form, houseStreet: e.target.value })} /></div>
                <div><Label>Sector/Area *</Label><Input value={form.sectorArea} onChange={(e) => setForm({ ...form, sectorArea: e.target.value })} /></div>
                <div><Label>City *</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div className="md:col-span-2">
                  <Label>Special Instructions for Rider</Label>
                  <Textarea rows={3} value={form.specialInstructions} onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })} />
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold"><CreditCard className="h-5 w-5 text-primary" /> Payment Method</h2>
              <div className="mt-3 rounded-lg border border-primary bg-primary/5 p-4">
                <div className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> Cash on Delivery - Open Box (Pay after inspection)</div>
                <div className="mt-1 text-xs text-muted-foreground">You can open and inspect the parcel before paying the rider.</div>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-xl border bg-card p-5 sm:p-6">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              {checkoutItems.map((it) => (
                <div key={it.product_id} className="flex justify-between gap-2">
                  <span className="line-clamp-1 pr-2">{it.title} × {it.quantity}</span>
                  <span>PKR {(it.price * it.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>PKR {checkoutTotal.toFixed(0)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total (COD)</span><span>PKR {checkoutTotal.toFixed(0)}</span></div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-md bg-veribuy/10 p-3 text-xs">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-veribuy shrink-0" />
              <span>Funds released only after you verify your unboxed package.</span>
            </div>
            <Button disabled={busy} type="submit" size="lg" className="mt-4 w-full bg-primary hover:bg-primary-hover">
              {busy ? "Placing..." : "Place Order (Cash on Delivery - Open Box)"}
            </Button>
          </aside>
        </form>
      </main>
      <Footer />
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order placed successfully</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Your order has been placed with COD open-box delivery.</p>
            <p className="font-semibold">Order ID: #{placedOrderCode}</p>
            <Button
              className="w-full"
              onClick={() => {
                setSuccessOpen(false);
                navigate({ to: "/thank-you" });
              }}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
