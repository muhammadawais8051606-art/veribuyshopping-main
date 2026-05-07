import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, MapPin, MessageCircle, Package, UserCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { VERIBUY_CATEGORIES } from "@/lib/veribuy-categories";

type ControlSidebarProps = {
  userName: string;
  trigger: React.ReactNode;
};

const items = [
  { label: "Manage Profile", to: "/profile", icon: UserCircle2 },
  { label: "My Orders", to: "/orders", icon: Package },
  { label: "Your Addresses", to: "/profile", icon: MapPin },
  { label: "Support", to: "/support", icon: MessageCircle },
  { label: "Feedback", to: "/feedback", icon: LayoutDashboard },
];

export function ControlSidebar({ userName, trigger }: ControlSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col p-0 max-h-[100dvh]">
        <SheetHeader className="shrink-0 bg-primary px-5 py-4 text-primary-foreground">
          <SheetTitle className="text-primary-foreground">Hello, {userName}</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 space-y-3"
            >
              {items.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                >
                  <Link
                    to={item.to as never}
                    className="flex min-h-11 items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-[#D4AF37] hover:bg-primary/5"
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex min-h-0 flex-1 flex-col border-t pt-4">
            <h3 className="mb-2 shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Shop by category
            </h3>
            <nav
              className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
              aria-label="Product categories"
            >
              {VERIBUY_CATEGORIES.map((category, idx) => (
                <Link
                  key={category.slug}
                  to="/shop"
                  search={{ category: category.slug } as never}
                  className="flex min-h-10 items-center rounded-lg border border-transparent px-3 py-2 text-sm text-foreground transition-colors hover:border-[#D4AF37]/80 hover:bg-muted/80"
                  style={{ animationDelay: `${idx * 12}ms` }}
                >
                  <span className="mr-2 w-6 shrink-0 text-right text-[11px] font-semibold text-muted-foreground">
                    {idx + 1}.
                  </span>
                  <span className="leading-snug">{category.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-4 shrink-0 rounded-xl border bg-secondary/60 p-4">
            <div className="text-sm font-semibold">Need instant help?</div>
            <Button
              asChild
              className="mt-3 min-h-11 w-full bg-success text-success-foreground hover:bg-success/90"
            >
              <a href="https://wa.me/923429839761" target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat with Support Team
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
