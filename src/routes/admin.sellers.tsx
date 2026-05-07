import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sellers")({
  component: AdminSellers,
});

type SellerUser = {
  id: string;
  shop_name: string | null;
  email: string;
  business_details: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
};
type Category = { id: string; name: string; slug: string };
type Product = { id: string; title: string; price: number; stock: number; is_active: boolean; seller_id: string };

function AdminSellers() {
  const [tab, setTab] = useState<"pending" | "all-sellers" | "categories" | "all-products">("pending");
  const [pendingSellers, setPendingSellers] = useState<SellerUser[]>([]);
  const [allSellers, setAllSellers] = useState<SellerUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const load = async () => {
    const [{ data: p }, { data: a }, { data: c }, { data: pr }] = await Promise.all([
      (supabase as any).from("sellers").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      (supabase as any).from("sellers").select("*").eq("status", "approved").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, slug").order("name"),
      supabase.from("products").select("id, title, price, stock, is_active, seller_id").order("created_at", { ascending: false }).limit(100),
    ]);
    setPendingSellers((p ?? []) as SellerUser[]);
    setAllSellers((a ?? []) as SellerUser[]);
    setCategories((c ?? []) as Category[]);
    setProducts((pr ?? []) as Product[]);
  };
  useEffect(() => { load(); }, []);

  const setSellerStatus = async (s: SellerUser, status: "approved" | "rejected" | "pending" | "suspended") => {
    const { error } = await (supabase as any).from("sellers").update({ status }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(`Seller ${status}.`);
    load();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const slug = newCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("categories").insert({ name: newCategory.trim(), slug });
    if (error) return toast.error(error.message);
    setNewCategory("");
    toast.success("Category added.");
    load();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted.");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "pending", label: `Pending Sellers (${pendingSellers.length})` },
          { id: "all-sellers", label: `All Sellers (${allSellers.length})` },
          { id: "categories", label: "Categories" },
          { id: "all-products", label: "All Products" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              tab === t.id ? "border-[#D4AF37] bg-[#D4AF37] text-white" : "bg-white hover:bg-[#fffaf0]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#fff8e3] text-left text-xs uppercase text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Shop Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pendingSellers.map((s) => (
                <tr key={s.id} className="hover:bg-[#fffcf2]">
                  <td className="px-4 py-3">{s.shop_name ?? "—"}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.business_details ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => setSellerStatus(s, "approved")} className="mr-2 bg-[#D4AF37] hover:bg-[#c39e30]">Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => setSellerStatus(s, "rejected")}>Reject</Button>
                  </td>
                </tr>
              ))}
              {pendingSellers.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No pending sellers.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "all-sellers" && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#fff8e3] text-left text-xs uppercase text-[#6b7280]">
              <tr><th className="px-4 py-3">Shop</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y">
              {allSellers.map((s) => (
                <tr key={s.id} className="hover:bg-[#fffcf2]">
                  <td className="px-4 py-3">{s.shop_name ?? "—"}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.business_details ?? "—"}</td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => setSellerStatus(s, "suspended")}>Suspend</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "categories" && (
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex gap-2">
            <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name" />
            <Button onClick={addCategory} className="bg-[#D4AF37] hover:bg-[#c39e30]">Add</Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((c) => <div key={c.id} className="rounded border p-2 text-sm">{c.name}</div>)}
          </div>
        </div>
      )}

      {tab === "all-products" && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#fff8e3] text-left text-xs uppercase text-[#6b7280]">
              <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Seller</th><th className="px-4 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-[#fffcf2]">
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3">PKR {Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.seller_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => deleteProduct(p.id)}>Delete</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
