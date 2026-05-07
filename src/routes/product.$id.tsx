import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCart } from "@/lib/cart-context";
import { ShieldCheck, ShoppingCart, Truck, PackageCheck, Star, CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { dummyProducts } from "@/lib/dummy-products";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

type Product = {
  id: string; title: string; description: string | null; price: number;
  image_url: string | null; stock: number; seller_id: string;
  original_price?: number;
  discount_percent?: number;
  gallery?: string[];
};

function ProductPage() {
  const { id } = Route.useParams();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<{ business_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<{ id: string; reviewer_name: string | null; rating: number; review_text: string | null; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      const fallback = dummyProducts.find((p) => p.id === id) as Product | undefined;
      const productData = (data as Product | null) ?? (fallback ?? null);
      setProduct(productData);
      if (productData) {
        setSelectedImage(productData.image_url ?? null);
      }
      if (data) {
        const { data: s } = await supabase.from("seller_profiles").select("business_name").eq("user_id", data.seller_id).maybeSingle();
        setSeller(s);
      } else if (fallback) {
        setSeller({ business_name: "VeriBuy Premium Store" });
      }
      const { data: r } = await supabase
        .from("product_reviews")
        .select("id, reviewer_name, rating, review_text, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      setReviews((r ?? []) as typeof reviews);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background"><TopNav /><div className="p-12 text-center text-muted-foreground">Loading...</div></div>;
  if (!product) return (
    <div className="min-h-screen bg-background"><TopNav />
      <div className="p-12 text-center"><div className="text-xl font-semibold">Product not found</div>
        <Link to="/shop" className="mt-3 inline-block text-primary hover:underline">Back to shop</Link></div>
    </div>
  );

  const out = product.stock <= 0;
  const averageRating = reviews.length
    ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
    : 0;

  const gallery = product.gallery && product.gallery.length > 0
    ? product.gallery
    : [product.image_url, product.image_url, product.image_url].filter(Boolean) as string[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.1fr_0.9fr]">
          <div>
            <div className="aspect-square overflow-hidden rounded-xl border bg-secondary">
              {selectedImage ? (
                <img src={selectedImage} alt={product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {gallery.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedImage(img)}
                    className={`overflow-hidden rounded-lg border ${selectedImage === img ? "border-primary" : ""}`}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="h-16 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="pb-20 lg:pb-0">
            <h1 className="text-3xl font-bold">{product.title}</h1>
            {seller && (
              <p className="mt-1 text-sm text-muted-foreground">
                Sold by <span className="font-semibold text-primary">{seller.business_name}</span>
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-warning">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-4 w-4 ${idx < Math.round(averageRating) ? "fill-warning text-warning" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <span className="font-medium">{averageRating ? averageRating.toFixed(1) : "0.0"}</span>
              <span className="text-muted-foreground">({reviews.length} ratings)</span>
            </div>
            <div className="mt-4 flex items-end gap-3 border-b pb-4">
              <div className="text-4xl font-extrabold text-foreground">PKR {Number(product.price).toFixed(0)}</div>
              {product.original_price && product.original_price > product.price && (
                <div className="pb-1 text-sm text-muted-foreground line-through">PKR {Number(product.original_price).toFixed(0)}</div>
              )}
              {product.discount_percent && (
                <div className="mb-1 rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">{product.discount_percent}% OFF</div>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {out ? <span className="text-destructive font-medium">Out of stock</span> : product.stock <= 5 ? "Limited Stock" : "In Stock"}
            </p>

            <div className="mt-5 rounded-xl border bg-veribuy/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-veribuy">
                <ShieldCheck className="h-5 w-5" /> VeriVerified
              </div>
              <div className="mt-2 flex items-center gap-2 font-semibold text-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex items-center gap-1 text-left">
                        <CircleHelp className="h-4 w-4 text-primary" /> Check First, Pay Later (Open Box Verification)
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-foreground text-background">
                      Rider opens the parcel at your doorstep. You inspect first; payment is released only after you approve.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="mt-1 text-sm text-foreground/80">
                Inspect your parcel at delivery, confirm the product condition, then payment is released securely.
              </p>
            </div>

            <p className="mt-6 whitespace-pre-line text-foreground/90">
              {product.description || "No description provided."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Fast secure shipping</div>
              <div className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-primary" /> Verify on delivery</div>
            </div>
          </div>
          <aside className="h-fit rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-3xl font-extrabold text-foreground">PKR {Number(product.price).toFixed(0)}</div>
            <div className="mt-1 text-sm text-muted-foreground">Inclusive of all taxes</div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium">Quantity</label>
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="min-h-11 w-full rounded-md border bg-background px-3 py-2"
                disabled={out}
              >
                {Array.from({ length: Math.min(10, Math.max(1, product.stock)) }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>Qty: {i + 1}</option>
                ))}
              </select>
            </div>
            <Button
              disabled={out}
              className="mt-4 min-h-11 w-full bg-primary hover:bg-primary-hover"
              onClick={() => {
                add({ product_id: product.id, seller_id: product.seller_id, title: product.title, price: Number(product.price), image_url: product.image_url }, qty);
                toast.success(`Added ${qty} to cart`);
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
            <Button
              disabled={out}
              asChild
              variant="outline"
              className="mt-2 min-h-11 w-full"
            >
              <Link to="/checkout" search={{ buyNow: product.id, quick: "1" } as never}>Buy Now</Link>
            </Button>
            <div className="mt-3 rounded-md bg-veribuy/10 px-3 py-2 text-xs font-semibold text-veribuy">
              VeriVerified | Open Box Delivery
            </div>
          </aside>
        </div>
      </main>
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-6 md:pb-8">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Customer Reviews</h2>
          <div className="mt-3 space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.reviewer_name || "Verified Buyer"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div className="mt-1 text-sm text-warning">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                {r.review_text && <p className="mt-1 text-sm text-foreground/80">{r.review_text}</p>}
              </div>
            ))}
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</p>}
          </div>
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card p-3 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <select
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="h-10 rounded-md border bg-background px-2 text-sm"
            disabled={out}
          >
            {Array.from({ length: Math.min(10, Math.max(1, product.stock)) }).map((_, i) => (
              <option key={i + 1} value={i + 1}>Qty {i + 1}</option>
            ))}
          </select>
          <Button
            disabled={out}
            className="min-h-11 flex-1 bg-primary hover:bg-primary-hover"
            onClick={() => {
              add({ product_id: product.id, seller_id: product.seller_id, title: product.title, price: Number(product.price), image_url: product.image_url }, qty);
              toast.success(`Added ${qty} to cart`);
            }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
          <Button disabled={out} asChild variant="outline" className="min-h-11 flex-1">
            <Link to="/checkout" search={{ buyNow: product.id, quick: "1" } as never}>Buy Now</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
