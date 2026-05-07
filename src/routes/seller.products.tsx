import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { uploadProductImageWithProgress } from "@/lib/product-image-upload";

export const Route = createFileRoute("/seller/products")({
  component: SellerProducts,
});

type Product = {
  id: string; title: string; description: string | null; price: number;
  stock: number; image_url: string | null; is_active: boolean; category_id: string | null;
};
type Category = { id: string; name: string; slug: string };

function emptyForm(): Omit<Product, "id"> {
  return { title: "", description: "", price: 0, stock: 0, image_url: "", is_active: true, category_id: null };
}

function SellerProducts() {
  const { user, sellerScopeId } = useAuth();
  const scopeId = sellerScopeId ?? user?.id ?? null;
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [sellerApproved, setSellerApproved] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [uploadBusy, setUploadBusy] = useState(false);

  const load = async () => {
    if (!scopeId) return;
    const { data } = await supabase.from("products").select("*").eq("seller_id", scopeId).order("created_at", { ascending: false });
    setItems((data ?? []) as Product[]);
  };

  useEffect(() => {
    load();
    supabase.from("categories").select("id, name, slug").order("name").then(({ data }) => setCats(data ?? []));
    if (scopeId) {
      (supabase as any).from("users").select("status").eq("id", scopeId).maybeSingle().then(({ data }: { data: { status: string } | null }) => {
        if (data?.status && data.status !== "approved") setSellerApproved(false);
      });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [scopeId]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setImageFile(null);
    setUploadPct(0);
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p, description: p.description ?? "", image_url: p.image_url ?? "" });
    setImageFile(null);
    setUploadPct(0);
    setOpen(true);
  };

  const uploadImage = async () => {
    if (!scopeId) return toast.error("Seller scope missing.");
    if (!imageFile) return toast.error("Please choose an image first.");
    setUploadBusy(true);
    setUploadPct(0);
    try {
      const { publicUrl } = await uploadProductImageWithProgress({
        file: imageFile,
        sellerId: scopeId,
        onProgress: (pct) => setUploadPct(pct),
      });
      setForm((f) => ({ ...f, image_url: publicUrl }));
      toast.success("Image uploaded.");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeId) return;
    if (!sellerApproved) return toast.error("Your seller account is pending approval. You cannot add or edit products yet.");
    if (!form.category_id) {
      toast.error("Please select a category.");
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      seller_id: scopeId,
      image_url: form.image_url || null,
      category_id: form.category_id || null,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Product updated" : "Product listed!");
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      {!sellerApproved && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
          Your seller account is awaiting admin approval. Product write actions are disabled.
        </div>
      )}
      <div className="mb-4 flex justify-between">
        <p className="text-sm text-muted-foreground">{items.length} products listed</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary hover:bg-primary-hover" disabled={!sellerApproved}>
              <Plus className="mr-1 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Title</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label>
                <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price ($)</Label>
                  <Input type="number" step="0.01" required value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} /></div>
                <div><Label>Stock</Label>
                  <Input type="number" required value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Product Image (Direct Upload)</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    disabled={uploadBusy || busy || !sellerApproved}
                  />
                  <Button type="button" onClick={uploadImage} disabled={uploadBusy || busy || !sellerApproved || !imageFile}>
                    {uploadBusy ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-secondary">
                  <div className="h-full bg-primary transition-[width]" style={{ width: `${uploadPct}%` }} />
                </div>
                <Input
                  value={form.image_url ?? ""}
                  readOnly
                  placeholder="Public image URL will appear here after upload"
                />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Popover open={catOpen} onOpenChange={setCatOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={catOpen}
                      className="h-11 w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {cats.find((c) => c.id === form.category_id)?.name ?? "Search & select category…"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search categories (30)…" />
                      <CommandList className="max-h-64">
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup heading="VeriBuy categories">
                          {cats.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              keywords={[c.slug, c.name.replace(/[^a-zA-Z0-9]+/g, " ")]}
                              onSelect={() => {
                                setForm({ ...form, category_id: c.id });
                                setCatOpen(false);
                              }}
                            >
                              <Check
                                className={cn("mr-2 h-4 w-4", form.category_id === c.id ? "opacity-100" : "opacity-0")}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active (visible in shop)
              </label>
              <DialogFooter>
                <Button disabled={busy} type="submit" className="bg-primary hover:bg-primary-hover">
                  {busy ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                No products yet. Click "Add Product" to list your first item.
              </td></tr>
            ) : items.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded bg-secondary">
                      {p.image_url ? <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" /> : null}
                    </div>
                    <span className="font-medium">{p.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">${Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {p.is_active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)} disabled={!sellerApproved}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(p.id)} className="text-destructive" disabled={!sellerApproved}>
                    <Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
