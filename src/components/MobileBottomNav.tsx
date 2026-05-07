import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingCart, User, Grid2x2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

const GOLD = "#D4AF37";

export function MobileBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();

  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-200",
      active ? "text-[#D4AF37]" : "text-[#D4AF37]/55",
    );

  return (
    <>
      <div className="h-16 md:hidden" />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/35 bg-nav md:hidden">
        <div className="mx-auto flex h-16 max-w-xl">
          <Link to="/" className={itemClass(path === "/")}>
            <Home className="h-5 w-5" style={{ color: path === "/" ? GOLD : undefined }} />
            Home
          </Link>
          <Link to="/shop" className={itemClass(path.startsWith("/shop"))}>
            <Grid2x2 className="h-5 w-5" style={{ color: path.startsWith("/shop") ? GOLD : undefined }} />
            Categories
          </Link>
          <Link to="/profile" className={itemClass(path.startsWith("/profile"))}>
            <User className="h-5 w-5" style={{ color: path.startsWith("/profile") ? GOLD : undefined }} />
            Profile
          </Link>
          <Link to="/cart" className={itemClass(path.startsWith("/cart"))}>
            <div className="relative">
              <ShoppingCart className="h-5 w-5" style={{ color: path.startsWith("/cart") ? GOLD : undefined }} />
              {count > 0 && (
                <span
                  className="absolute -right-2 -top-2 min-w-4 rounded-full px-1 text-[9px] font-bold text-nav"
                  style={{ backgroundColor: GOLD }}
                >
                  {count}
                </span>
              )}
            </div>
            Cart
          </Link>
        </div>
      </nav>
    </>
  );
}
