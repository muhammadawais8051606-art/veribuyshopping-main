import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { dummyProducts } from "@/lib/dummy-products";
import { productMatchesSmartSearch, type ProductSearchRow } from "@/lib/veribuy-categories";

type Search = { q?: string; category?: string; scroll?: "grid" };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    scroll: s.scroll === "grid" ? "grid" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop all products — VeriBuy" },
      { name: "description", content: "Browse products from all VeriBuy vendors. Filter by category and search." },
    ],
  }),
  component: ShopPage,
});

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  seller_id: string;
  stock: number;
  category_id: string | null;
  description: string | null;
  categories: { name: string; slug: string } | null;
  original_price?: number;
  discount_percent?: number;
};

function ShopPage() {
  const { q, category, scroll } = useSearch({ from: "/shop" });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const trimmedQuery = useMemo(() => (q ?? "").trim(), [q]);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      const decorate = (rows: Product[]) =>
        rows.map((p) => ({
          ...p,
          original_price: Math.round(Number(p.price) * 1.12),
          discount_percent: 12,
        }));

      if (trimmedQuery) {
        const { data } = await supabase
          .from("products")
          .select("id, title, description, price, stock, image_url, seller_id, category_id, categories ( name, slug )")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(200);
        const rows = (data ?? []) as Product[];
        let filtered = rows.filter((p) => productMatchesSmartSearch(p as ProductSearchRow, trimmedQuery));
        if (category) {
          filtered = filtered.filter((p) => p.categories?.slug === category);
        }
        const decorated = decorate(filtered);
        const fallbackRaw =
          decorated.length >= 4
            ? []
            : dummyProducts
                .map((d) => ({
                  id: d.id,
                  title: d.title,
                  price: d.price,
                  original_price: d.originalPrice,
                  discount_percent: d.discountPercent,
                  image_url: d.image_url,
                  seller_id: d.seller_id,
                  stock: d.stock,
                  category_id: null as string | null,
                  description: d.description,
                  categories: null as { name: string; slug: string } | null,
                }))
                .filter((p) => productMatchesSmartSearch(p as ProductSearchRow, trimmedQuery));
        setProducts([...decorated, ...fallbackRaw]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("products")
        .select("id, title, description, price, stock, image_url, seller_id, category_id, categories ( name, slug )")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (category) {
        const cat = await supabase.from("categories").select("id").eq("slug", category).maybeSingle();
        if (cat.data) query = query.eq("category_id", cat.data.id);
      }
      const { data } = await query.limit(60);
      const live = (data ?? []) as Product[];
      const decorated = decorate(live);
      const fallback =
        decorated.length >= 4
          ? []
          : dummyProducts.map((d) => ({
              id: d.id,
              title: d.title,
              price: d.price,
              original_price: d.originalPrice,
              discount_percent: d.discountPercent,
              image_url: d.image_url,
              seller_id: d.seller_id,
              stock: d.stock,
              category_id: null,
              description: d.description,
              categories: null,
            }));
      setProducts([...decorated, ...fallback]);
      setLoading(false);
    })();
  }, [trimmedQuery, category]);

  useEffect(() => {
    if (scroll !== "grid") return;
    const target = document.getElementById("product-grid");
    if (target) {
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [scroll, products.length, loading]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">
            {trimmedQuery
              ? `Results for "${trimmedQuery}"`
              : category
                ? (categories.find((c) => c.slug === category)?.name ?? "Shop")
                : "All Products"}
          </h1>
          <span className="text-sm text-muted-foreground">{products.length} items</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border bg-card py-16 text-center">
            <div className="text-lg font-semibold">No products found</div>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p>
          </div>
        ) : (
          <div id="product-grid" className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                price={Number(p.price)}
                image_url={p.image_url}
                seller_id={p.seller_id}
                stock={p.stock}
                original_price={p.original_price}
                discount_percent={p.discount_percent}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
