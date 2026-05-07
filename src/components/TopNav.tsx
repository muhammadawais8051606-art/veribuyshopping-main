import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingCart, MapPin, User as UserIcon, Menu, ShieldCheck, LayoutDashboard, LogOut, List } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { ROOT_ADMIN_EMAIL } from "@/lib/platform-config";
import { ControlSidebar } from "@/components/ControlSidebar";
import { useAddress } from "@/lib/address-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { productMatchesSmartSearch, VERIBUY_CATEGORIES } from "@/lib/veribuy-categories";
import { cn } from "@/lib/utils";

type NavSearchHit = {
  id: string;
  title: string;
  categories: { name: string; slug: string } | null;
};

export function TopNav() {
  const { user, roles, signOut } = useAuth();
  const { count } = useCart();
  const { addresses, addressSummary, setActiveAddressId } = useAddress();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [searchHits, setSearchHits] = useState<NavSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate({
      to: "/shop",
      search: {
        q: q || undefined,
        category: category !== "all" ? category : undefined,
      } as never,
    });
  };

  const runLiveSearch = useCallback(async (query: string) => {
    const t = query.trim();
    if (t.length < 2) {
      setSearchHits([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, title, description, categories ( name, slug )")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200);
    const rows = (data ?? []) as (NavSearchHit & { description: string | null })[];
    const hits = rows
      .filter((row) =>
        productMatchesSmartSearch(
          { title: row.title, description: row.description, categories: row.categories },
          t,
        ),
      )
      .slice(0, 8)
      .map(({ id, title, categories }) => ({ id, title, categories }));
    setSearchHits(hits);
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setSearchHits([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const id = window.setTimeout(() => {
      void runLiveSearch(q);
    }, 220);
    return () => window.clearTimeout(id);
  }, [q, runLiveSearch]);

  const scrollToHero = () => {
    if (typeof window === "undefined") return;
    const hero = document.getElementById("hero-section");
    if (hero) {
      window.scrollTo({ top: hero.offsetTop - 80, behavior: "smooth" });
      return;
    }
    navigate({ to: "/", search: { scroll: "hero" } as never });
  };

  const isAdmin = roles.includes("admin") && user?.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

  const addressMenu = (
    <>
      <DropdownMenuLabel>Select Delivery Address</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {addresses.length === 0 ? (
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate({ to: "/profile" })}>
          Add a saved address in your profile
        </DropdownMenuItem>
      ) : (
        addresses.map((address) => (
          <DropdownMenuItem
            key={address.id}
            onClick={() => setActiveAddressId(address.id)}
            className="flex cursor-pointer flex-col items-start"
          >
            <span className="text-xs font-semibold">
              {address.city} {address.postal_code ?? ""}
            </span>
            <span className="line-clamp-1 text-[11px] text-muted-foreground">{address.line1}</span>
          </DropdownMenuItem>
        ))
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-nav text-nav-foreground shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-2 py-1.5 md:flex-nowrap md:gap-4 md:px-6 md:py-2">
        <ControlSidebar
          userName={user ? (user.email?.split("@")[0] ?? "Customer") : "Guest"}
          trigger={
            <button className="min-h-11 min-w-11 rounded p-2 hover:bg-nav-accent" aria-label="Open control sidebar">
              <Menu className="h-5 w-5" />
            </button>
          }
        />
        <button
          type="button"
          onClick={scrollToHero}
          className="flex shrink-0 items-center gap-1.5 font-bold tracking-tight md:mr-1"
          aria-label="Scroll to hero section"
        >
          <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
          <div className="leading-tight">
            <div className="text-lg">VeriBuy</div>
            <div className="hidden text-[10px] font-medium uppercase tracking-wide text-nav-foreground/70 md:block">
              Trusted Marketplace
            </div>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="hidden min-h-9 min-w-0 max-w-[140px] items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-nav-accent lg:flex">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" />
            <div className="min-w-0 text-left leading-tight">
              <div className="text-[9px] opacity-70">Deliver to</div>
              <div className="truncate text-[10px] font-semibold">{addressSummary}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {addressMenu}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-h-9 max-w-[120px] items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-nav-accent lg:hidden">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" />
            <div className="min-w-0 text-left leading-tight">
              <div className="text-[9px] opacity-70">Deliver to</div>
              <div className="truncate text-[10px] font-semibold">{addressSummary}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {addressMenu}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={searchOpen && q.trim().length >= 2} onOpenChange={setSearchOpen}>
          <PopoverAnchor asChild>
            <form
              onSubmit={search}
              onFocus={() => setSearchOpen(true)}
              className="order-last flex w-full min-w-0 basis-full overflow-hidden rounded-md bg-background ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-nav md:order-none md:basis-0 md:flex-1"
            >
              <select
                aria-label="Search category"
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  if (val !== "all") {
                    navigate({ to: "/shop", search: { category: val } as never });
                  }
                }}
                className="max-w-[110px] shrink-0 border-r border-[#D4AF37]/40 bg-muted px-1.5 text-[11px] text-foreground outline-none md:max-w-[130px] md:px-2 md:text-xs"
              >
                <option value="all">All</option>
                {VERIBUY_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search VeriBuy"
                className="min-h-11 flex-1 bg-background px-2 py-2 text-sm text-foreground outline-none md:px-3"
              />
              <button
                type="submit"
                aria-label="Search"
                className="min-h-11 min-w-11 shrink-0 bg-[#D4AF37] px-2 text-nav transition-colors hover:bg-[#c29f31] md:px-3"
              >
                <Search className="h-5 w-5 text-nav" />
              </button>
            </form>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="z-50 max-h-[min(70vh,420px)] w-[min(100vw-1.5rem,42rem)] overflow-y-auto border-[#D4AF37]/50 p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
              Instant results
            </div>
            {searchLoading ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">Searching…</div>
            ) : searchHits.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matches — press enter to search shop</div>
            ) : (
              <ul className="py-1">
                {searchHits.map((hit) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                      )}
                      onClick={() => {
                        setSearchOpen(false);
                        navigate({ to: "/product/$id", params: { id: hit.id } });
                      }}
                    >
                      <span className="line-clamp-2 font-medium text-foreground">{hit.title}</span>
                      {hit.categories?.name ? (
                        <span className="text-[11px] text-muted-foreground">{hit.categories.name}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-border p-2">
              <button
                type="button"
                className="w-full rounded-md bg-[#D4AF37] py-2 text-sm font-semibold text-nav hover:bg-[#c29f31]"
                onClick={() => {
                  setSearchOpen(false);
                  navigate({
                    to: "/shop",
                    search: { q: q.trim() || undefined, category: category !== "all" ? category : undefined } as never,
                  });
                }}
              >
                See all results
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger className="hidden min-h-11 min-w-11 items-center gap-1 rounded px-2 py-1 text-sm hover:bg-nav-accent md:flex">
            <UserIcon className="h-4 w-4" />
            <div className="text-left leading-tight">
              <div className="text-[10px] opacity-70">{user ? "Hello," : "Sign in"}</div>
              <div className="max-w-[100px] truncate font-semibold">{user ? "Account & Lists" : "Account & Lists"}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {!user ? (
              <>
                <DropdownMenuItem onClick={() => navigate({ to: "/auth" })}>Sign in</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}>
                  Create account
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Your Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <MapPin className="mr-2 h-4 w-4" /> Your Addresses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Your Orders
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          to="/cart"
          className="relative flex min-h-11 min-w-11 items-center gap-1 rounded px-2 py-1 hover:bg-nav-accent"
        >
          <ShoppingCart className="h-6 w-6 text-[#D4AF37]" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-xs font-bold text-nav">
              {count}
            </span>
          )}
          <span className="hidden md:inline text-sm font-semibold">Cart</span>
        </Link>
      </div>

      <div className="bg-nav-accent">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-1.5 text-sm md:px-6">
          <button className="flex min-h-11 min-w-11 items-center gap-1 rounded px-2 py-0.5 whitespace-nowrap hover:bg-nav">
            <List className="h-4 w-4" />
            All
          </button>
          <Link
            to="/shop"
            search={{ deals: "today" } as never}
            className="min-h-11 rounded px-2 py-2 whitespace-nowrap hover:bg-nav"
          >
            Today's Deals
          </Link>
        </div>
      </div>

      <div className="hidden">{path}</div>
    </header>
  );
}
