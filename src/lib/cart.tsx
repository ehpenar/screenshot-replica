import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  key: string;
  product_id: string;
  variant_id: string | null;
  name: string;
  label: string;
  image: string;
  unit_price: number;
  quantity: number;
  max: number;
};

type Ctx = {
  items: CartItem[];
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (i: Omit<CartItem, "key">) => void;
  setQty: (key: string, q: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nido-cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("nido-cart", JSON.stringify(items));
  }, [items]);

  const add: Ctx["add"] = (i) => {
    const key = `${i.product_id}:${i.variant_id ?? "-"}`;
    setItems((prev) => {
      const ex = prev.find((p) => p.key === key);
      if (ex) return prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(p.max, p.quantity + i.quantity) } : p));
      return [...prev, { ...i, key, quantity: Math.min(i.max, i.quantity) }];
    });
    setOpen(true);
  };
  const setQty = (key: string, q: number) =>
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, quantity: Math.max(1, Math.min(p.max, q)) } : p)));
  const remove = (key: string) => setItems((prev) => prev.filter((p) => p.key !== key));
  const clear = () => setItems([]);
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, open, setOpen, add, setQty, remove, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
