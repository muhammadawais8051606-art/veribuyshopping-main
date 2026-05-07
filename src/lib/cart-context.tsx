import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  seller_id: string;
  title: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "veribuy_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const add: CartContextValue["add"] = (item, qty = 1) => {
    setItems((curr) => {
      const existing = curr.find((c) => c.product_id === item.product_id);
      if (existing) {
        return curr.map((c) =>
          c.product_id === item.product_id ? { ...c, quantity: c.quantity + qty } : c,
        );
      }
      return [...curr, { ...item, quantity: qty }];
    });
  };
  const remove = (productId: string) =>
    setItems((curr) => curr.filter((c) => c.product_id !== productId));
  const setQty = (productId: string, qty: number) =>
    setItems((curr) =>
      curr.map((c) => (c.product_id === productId ? { ...c, quantity: Math.max(1, qty) } : c)),
    );
  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
