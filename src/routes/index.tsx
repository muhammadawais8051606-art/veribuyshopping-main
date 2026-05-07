import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dummyProducts } from "@/lib/dummy-products";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    scroll: s.scroll === "hero" ? "hero" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "VeriBuy — Shop with Unbox Verification" },
      { name: "description", content: "VeriBuy is a multi-vendor marketplace. Browse millions of products and pay only after you verify your delivery in person." },
      { property: "og:title", content: "VeriBuy — Shop with Unbox Verification" },
      { property: "og:description", content: "Pay only after you unbox. Trust delivered." },
    ],
  }),
  component: Home,
});

function Home() {
  const { scroll } = useSearch({ from: "/" });
  const heroSlides = useMemo(
    () => [
      {
        title: "Runway to Doorstep",
        subtitle: "Fashion",
        categorySlug: "womens-fashion" as const,
        image:
          "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=400&q=80",
      },
      {
        title: "Flagship Tech, Verified Delivery",
        subtitle: "Tech",
        categorySlug: "electronics" as const,
        image:
          "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&h=400&q=80",
      },
      {
        title: "Level Up with Confidence",
        subtitle: "Gaming",
        categorySlug: "movies-games" as const,
        image:
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&h=400&q=80",
      },
      {
        title: "Elevate Every Room",
        subtitle: "Home",
        categorySlug: "home-kitchen" as const,
        image:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&h=400&q=80",
      },
      {
        title: "Glow with Authentic Care",
        subtitle: "Beauty",
        categorySlug: "beauty-personal-care" as const,
        image:
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&h=400&q=80",
      },
    ],
    [],
  );
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (scroll !== "hero") return;
    const hero = document.getElementById("hero-section");
    if (hero) window.scrollTo({ top: hero.offsetTop - 80, behavior: "smooth" });
  }, [scroll]);

  const categoryCards = [
    {
      title: "Smart Electronics",
      mode: "single" as const,
      to: "/shop",
      search: { category: "electronics" } as never,
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Tech Essentials",
      mode: "grid" as const,
      to: "/shop",
      search: { category: "electronics" } as never,
      items: [
        { label: "Buds", image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?auto=format&fit=crop&w=600&q=80" },
        { label: "Watches", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80" },
        { label: "Laptops", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80" },
        { label: "Speakers", image: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=600&q=80" },
      ],
    },
    {
      title: "Fashion Highlights",
      mode: "single" as const,
      to: "/shop",
      search: { category: "womens-fashion" } as never,
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Home Upgrade Picks",
      mode: "grid" as const,
      to: "/shop",
      search: { category: "home-kitchen" } as never,
      items: [
        { label: "Kitchen", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80" },
        { label: "Decor", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" },
        { label: "Storage", image: "https://images.unsplash.com/photo-1582582429416-f3f5137ec5c2?auto=format&fit=crop&w=600&q=80" },
        { label: "Lighting", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80" },
      ],
    },
  ];

  const inspiredByBrowsing = dummyProducts.slice(0, 6);
  const trendingInPakistan = [...dummyProducts].reverse().slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
      <TopNav />

      <section id="hero-section" className="mx-auto w-full max-w-7xl px-3 pb-4 pt-3 md:px-6">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-sm">
          VeriBuy: Inspect your tech/fashion at your doorstep before you pay.
        </p>
        <div className="relative overflow-hidden rounded-xl">
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === activeSlide ? "opacity-100" : "opacity-0"}`}
            >
              <img src={slide.image} alt={slide.title} className="h-[320px] w-full object-cover md:h-[400px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-black/20" />
              <div className="absolute left-4 top-4 rounded-md bg-black/75 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#D4AF37] md:left-6 md:text-sm">
                Open Box Verified
              </div>
              <div className="absolute left-6 top-1/2 max-w-lg -translate-y-1/2 text-white md:left-12">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">{slide.subtitle}</p>
                <h1 className="text-3xl font-bold md:text-5xl">{slide.title}</h1>
                <Button asChild className="mt-5 min-h-11 bg-[#D4AF37] font-semibold text-nav hover:bg-[#c29f31]">
                  <Link to="/shop" search={{ category: slide.categorySlug } as never}>
                    Explore Detail
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          <div className="relative flex h-[320px] items-end justify-between p-4 md:h-[400px]">
            <button
              aria-label="Previous banner"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
              onClick={() => setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Next banner"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
              onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 py-3 md:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {categoryCards.map((card) => (
            <Link
              key={card.title}
              to={card.to as never}
              search={card.search}
              className="rounded-md border border-[#e3e6e6] bg-white p-4 shadow-sm"
            >
              <h2 className="mb-3 text-lg font-bold text-foreground">{card.title}</h2>
              {card.mode === "single" ? (
                <img src={card.image} alt={card.title} className="h-[250px] w-full rounded object-cover" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {card.items.map((item) => (
                    <div key={item.label}>
                      <img src={item.image} alt={item.label} className="h-[120px] w-full rounded object-cover" />
                      <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <span className="mt-3 inline-block text-sm font-semibold text-primary">See more</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 py-3 md:px-6">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <h3 className="text-xl font-bold">Inspired by Your Browsing</h3>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {inspiredByBrowsing.map((product) => (
              <Link to="/product/$id" params={{ id: product.id }} key={product.id} className="min-w-[220px] rounded-md border border-[#e3e6e6] bg-white p-3">
                <img src={product.image_url} alt={product.title} className="h-[150px] w-full rounded object-cover" />
                <div className="mt-2 line-clamp-2 text-sm font-medium">{product.title}</div>
                <div className="mt-1 text-lg font-bold text-primary">PKR {product.price.toFixed(0)}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-veribuy/10 px-2 py-1 text-[11px] font-semibold text-veribuy">
                  <ShieldCheck className="h-3 w-3" /> VeriVerify
                </div>
                <div className="mt-3 text-sm font-semibold text-primary">View Product Details</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-3 pb-8 pt-3 md:px-6">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <h3 className="text-xl font-bold">Trending in Pakistan</h3>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {trendingInPakistan.map((product) => (
              <Link to="/product/$id" params={{ id: product.id }} key={product.id} className="min-w-[220px] rounded-md border border-[#e3e6e6] bg-white p-3">
                <img src={product.image_url} alt={product.title} className="h-[150px] w-full rounded object-cover" />
                <div className="mt-2 line-clamp-2 text-sm font-medium">{product.title}</div>
                <div className="mt-1 text-lg font-bold text-primary">PKR {product.price.toFixed(0)}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-veribuy/10 px-2 py-1 text-[11px] font-semibold text-veribuy">
                  <ShieldCheck className="h-3 w-3" /> VeriVerify
                </div>
                <div className="mt-3 text-sm font-semibold text-primary">View Product Details</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
