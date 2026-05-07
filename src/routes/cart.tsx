import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — VeriBuy" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, setQty, total, count } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-xl border bg-card py-16 text-center">
            <div className="text-lg font-semibold">Your cart is empty</div>
            <Button asChild className="mt-4 bg-primary hover:bg-primary-hover">
              <Link to="/shop">Continue shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-xl border bg-card divide-y">
              {items.map((it) => (
                <div key={it.product_id} className="flex gap-4 p-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-secondary">
                    {it.image_url ? <img src={it.image_url} alt={it.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link to="/product/$id" params={{ id: it.product_id }} className="line-clamp-2 font-medium hover:text-primary">
                      {it.title}
                    </Link>
                    <div className="mt-auto flex items-center gap-3">
                      <select
                        value={it.quantity}
                        onChange={(e) => setQty(it.product_id, Number(e.target.value))}
                        className="rounded-md border bg-background px-2 py-1 text-sm"
                      >
                        {Array.from({ length: 10 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>Qty: {i + 1}</option>
                        ))}
                      </select>
                      <button onClick={() => remove(it.product_id)} className="flex items-center gap-1 text-sm text-destructive hover:underline">
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-bold">${(it.price * it.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex justify-between text-lg">
                <span>Subtotal ({count} items):</span>
                <span className="font-bold">${total.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-md bg-veribuy/10 p-3 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-veribuy shrink-0" />
                <span>Protected by VeriBuy. Payment finalizes only after you verify your unboxed delivery.</span>
              </div>
              <Button
                onClick={() => navigate({ to: "/checkout" })}
                className="mt-4 w-full bg-primary hover:bg-primary-hover"
                size="lg"
              >
                Proceed to Checkout
              </Button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
