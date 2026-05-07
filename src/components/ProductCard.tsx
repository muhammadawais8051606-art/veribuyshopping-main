import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

export type ProductCardProps = {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  image_url: string | null;
  seller_id: string;
  stock: number;
};

const PREMIUM_FALLBACKS = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?auto=format&fit=crop&w=1200&q=80",
];

export function ProductCard(p: ProductCardProps) {
  const { add } = useCart();
  const navigate = useNavigate();
  const out = p.stock <= 0;
  const imageSrc = p.image_url ?? PREMIUM_FALLBACKS[p.title.length % PREMIUM_FALLBACKS.length];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg">
      <Link to="/product/$id" params={{ id: p.id }} className="block aspect-square overflow-hidden bg-secondary">
        <img
          src={imageSrc}
          alt={p.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="inline-flex w-fit items-center rounded-full bg-veribuy/10 px-2 py-0.5 text-[10px] font-semibold text-veribuy">
          Unbox Verification Guaranteed
        </div>
        <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-2 text-sm font-medium hover:text-primary">
          {p.title}
        </Link>
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {p.original_price && p.original_price > p.price && (
              <span className="text-xs text-muted-foreground line-through">PKR {Number(p.original_price).toFixed(0)}</span>
            )}
            <span className="text-lg font-bold text-primary">PKR {Number(p.price).toFixed(0)}</span>
            {p.discount_percent ? (
              <span className="text-[10px] font-semibold text-success">{p.discount_percent}% OFF</span>
            ) : null}
          </div>
          <span className={`text-xs font-medium ${out ? "text-destructive" : p.stock <= 5 ? "text-warning" : "text-success"}`}>
            {out ? "Out of Stock" : p.stock <= 5 ? "Limited Stock" : "In Stock"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            disabled={out}
            className="h-9 w-full bg-primary hover:bg-primary-hover md:h-8"
            onClick={() => {
              add({ product_id: p.id, seller_id: p.seller_id, title: p.title, price: Number(p.price), image_url: p.image_url });
              toast.success("Added to cart");
            }}
          >
            <ShoppingCart className="mr-1 h-4 w-4" /> Add to Cart
          </Button>
          <Button
            size="sm"
            disabled={out}
            variant="outline"
            className="h-9 w-full md:h-8"
            onClick={() => navigate({ to: "/checkout", search: { buyNow: p.id } as never })}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}
