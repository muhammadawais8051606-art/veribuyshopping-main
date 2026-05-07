import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Store, ShoppingBag, DollarSign } from "lucide-react";
import { VERIBUY_BANK_DETAILS } from "@/lib/platform-config";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [s, setS] = useState({ users: 0, sellers: 0, pending: 0, products: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadError(null);
        const [
          { count: usersCount },
          { count: approvedSellersCount },
          { count: pendingSellersCount },
          { count: productsCount },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          (supabase as any).from("sellers").select("*", { count: "exact", head: true }).eq("status", "approved"),
          (supabase as any).from("sellers").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("products").select("*", { count: "exact", head: true }),
        ]);

        if (!cancelled) {
          setS({
            users: Number(usersCount ?? 0),
            sellers: Number(approvedSellersCount ?? 0),
            pending: Number(pendingSellersCount ?? 0),
            products: Number(productsCount ?? 0),
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[Admin] Failed to load overview data", error);
          setLoadError("Unable to load live admin data from Supabase right now. Please run latest migrations.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: "Total Users", value: s.users, icon: Users, color: "text-primary" },
    { label: "Approved Sellers", value: s.sellers, icon: Store, color: "text-success" },
    { label: "Pending Applications", value: s.pending, icon: Store, color: "text-warning" },
    { label: "Total Products", value: s.products, icon: ShoppingBag, color: "text-veribuy" },
  ];

  return (
    <>
      {loadError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="mt-2 text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
      <section className="mt-4 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground">Official Bank Details</h2>
        <div className="mt-2 text-base font-semibold">{VERIBUY_BANK_DETAILS.bankName}</div>
        <div className="text-sm">{VERIBUY_BANK_DETAILS.accountTitle}</div>
        <div className="mt-1 font-mono text-sm">{VERIBUY_BANK_DETAILS.iban}</div>
      </section>
    </>
  );
}
