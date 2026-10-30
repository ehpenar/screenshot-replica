const DB_KEY = "nido-beta-db-v1";
const AUTH_KEY = "nido-beta-auth";
const ADMIN_PASS_KEY = "nido-beta-admin-pass";
const FREE_SHIPPING_FROM = 300000;
const SHIPPING_COST = 15000;

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  sort: number | null;
  created_at: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  material: string | null;
  base_price: number;
  cost_price: number;
  images: string[];
  stock_quantity: number;
  low_stock_threshold: number;
  active: boolean;
  featured: boolean;
  created_at: string | null;
};

export type Variant = {
  id: string;
  product_id: string;
  color_name: string;
  color_hex: string;
  size: string;
  sku: string | null;
  price_adjustment: number;
  image: string | null;
};

export type ProductWithVariants = Product & { product_variants: Variant[]; categories: Category | null };

export type LocalUser = { id: string; email: string; name: string; role: "admin" | "customer" };

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  unit_cost: number;
};

export type Order = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  address: string;
  order_date: string;
  status: string;
  subtotal: number;
  shipping: number;
  total_amount: number;
  order_items: OrderItem[];
};

export type InventoryLog = {
  id: string;
  product_id: string | null;
  type: "Entry" | "Sale";
  quantity: number;
  date: string;
  notes: string | null;
  products?: { name: string } | null;
};

type Db = {
  categories: Category[];
  products: Product[];
  variants: Variant[];
  orders: Order[];
  inventory_logs: InventoryLog[];
};

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function seed(): Db {
  const cats: Category[] = [
    { id: uid(), name: "Sábanas", slug: "sabanas", description: "Algodón suave y percal para noches frescas", cover_image: "/images/cat-sabanas.jpg", sort: 1, created_at: now() },
    { id: uid(), name: "Edredones", slug: "edredones", description: "Calidez ligera en cada estación", cover_image: "/images/cat-edredones.jpg", sort: 2, created_at: now() },
    { id: uid(), name: "Cobijas", slug: "cobijas", description: "Texturas acogedoras para abrazar", cover_image: "/images/cat-cobijas.jpg", sort: 3, created_at: now() },
    { id: uid(), name: "Almohadas", slug: "almohadas", description: "Soporte y suavidad para tu descanso", cover_image: "/images/cat-almohadas.jpg", sort: 4, created_at: now() },
    { id: uid(), name: "Combos", slug: "combos", description: "Juegos completos, listos para tu cama", cover_image: "/images/hero.jpg", sort: 5, created_at: now() },
  ];
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const rawProducts: Omit<Product, "id" | "created_at">[] = [
    { name: "Juego de Sábanas Percal 300 Hilos", description: "Percal de algodón peinado, fresco y con caída perfecta. Incluye sábana bajera, plana y dos fundas.", category_id: bySlug.sabanas!, material: "Algodón", base_price: 189000, cost_price: 95000, images: ["/images/cat-sabanas.jpg"], stock_quantity: 24, low_stock_threshold: 5, active: true, featured: true },
    { name: "Sábanas de Lino Lavado", description: "Lino europeo prelavado con textura natural y aspecto relajado.", category_id: bySlug.sabanas!, material: "Lino", base_price: 329000, cost_price: 170000, images: ["/images/cat-sabanas.jpg"], stock_quantity: 8, low_stock_threshold: 5, active: true, featured: true },
    { name: "Sábanas Microfibra Brisa", description: "Microfibra cepillada, suave al tacto y fácil de lavar.", category_id: bySlug.sabanas!, material: "Microfibra", base_price: 99000, cost_price: 45000, images: ["/images/cat-sabanas.jpg"], stock_quantity: 40, low_stock_threshold: 5, active: true, featured: false },
    { name: "Edredón Nube Reversible", description: "Relleno hipoalergénico de fibra hueca siliconada, reversible bicolor.", category_id: bySlug.edredones!, material: "Algodón", base_price: 259000, cost_price: 130000, images: ["/images/cat-edredones.jpg"], stock_quantity: 12, low_stock_threshold: 5, active: true, featured: true },
    { name: "Edredón Pluma Ligera", description: "Sensación de pluma con relleno sintético premium, ideal todo el año.", category_id: bySlug.edredones!, material: "Microfibra", base_price: 349000, cost_price: 180000, images: ["/images/cat-edredones.jpg"], stock_quantity: 3, low_stock_threshold: 5, active: true, featured: false },
    { name: "Cobija Tejida Algodón", description: "Tejido grueso tipo waffle, perfecta a los pies de la cama.", category_id: bySlug.cobijas!, material: "Algodón", base_price: 149000, cost_price: 70000, images: ["/images/cat-cobijas.jpg"], stock_quantity: 18, low_stock_threshold: 5, active: true, featured: true },
    { name: "Cobija Flannel Sherpa", description: "Doble faz: flannel por un lado, sherpa por el otro.", category_id: bySlug.cobijas!, material: "Poliéster", base_price: 129000, cost_price: 60000, images: ["/images/cat-cobijas.jpg"], stock_quantity: 4, low_stock_threshold: 5, active: true, featured: false },
    { name: "Almohada Viscoelástica", description: "Memory foam que se adapta a tu cuello. Funda removible.", category_id: bySlug.almohadas!, material: "Viscoelástica", base_price: 119000, cost_price: 55000, images: ["/images/cat-almohadas.jpg"], stock_quantity: 30, low_stock_threshold: 5, active: true, featured: true },
    { name: "Almohada Fibra Suave", description: "Relleno de fibra siliconada, suave y esponjosa.", category_id: bySlug.almohadas!, material: "Microfibra", base_price: 59000, cost_price: 25000, images: ["/images/cat-almohadas.jpg"], stock_quantity: 50, low_stock_threshold: 5, active: true, featured: false },
    { name: "Combo Descanso Total", description: "Sábanas percal + edredón Nube + 2 almohadas fibra. Todo coordinado.", category_id: bySlug.combos!, material: "Algodón", base_price: 529000, cost_price: 280000, images: ["/images/hero.jpg"], stock_quantity: 6, low_stock_threshold: 5, active: true, featured: true },
  ];

  const products: Product[] = rawProducts.map((p) => ({ ...p, id: uid(), created_at: now() }));
  const colors = [
    { n: "Marfil", h: "#F3EDE2" },
    { n: "Salvia", h: "#A9B8A0" },
    { n: "Arena", h: "#D8C3A5" },
    { n: "Rosa Polvo", h: "#E3C2BC" },
  ];
  const sizes = [
    { sz: "Single", adj: -30000 },
    { sz: "Queen", adj: 0 },
    { sz: "King", adj: 40000 },
  ];

  const variants: Variant[] = [];
  for (const p of products) {
    if (p.name.startsWith("Almohada")) {
      variants.push({
        id: uid(),
        product_id: p.id,
        color_name: "Blanco",
        color_hex: "#FAFAF7",
        size: "Estándar",
        sku: `${p.name.slice(0, 3).toUpperCase()}-STD`,
        price_adjustment: 0,
        image: null,
      });
      continue;
    }
    for (const c of colors) {
      for (const s of sizes) {
        variants.push({
          id: uid(),
          product_id: p.id,
          color_name: c.n,
          color_hex: c.h,
          size: s.sz,
          sku: `${p.name.slice(0, 3).toUpperCase()}-${c.n.slice(0, 3)}-${s.sz}`,
          price_adjustment: s.adj,
          image: null,
        });
      }
    }
  }

  const logs: InventoryLog[] = products
    .filter((p) => p.stock_quantity > 0)
    .map((p) => ({
      id: uid(),
      product_id: p.id,
      type: "Entry" as const,
      quantity: p.stock_quantity,
      date: now(),
      notes: "Stock inicial",
      products: { name: p.name },
    }));

  return { categories: cats, products, variants, orders: [], inventory_logs: logs };
}

function readDb(): Db {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* ignore */
  }
  const db = seed();
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

function writeDb(db: Db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function getCategories(): Category[] {
  return [...readDb().categories].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

export function getProducts(): ProductWithVariants[] {
  const db = readDb();
  const catMap = Object.fromEntries(db.categories.map((c) => [c.id, c]));
  return db.products
    .map((p) => ({
      ...p,
      product_variants: db.variants.filter((v) => v.product_id === p.id),
      categories: p.category_id ? catMap[p.category_id] ?? null : null,
    }))
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
}

export function getOrders(): Order[] {
  return [...readDb().orders].sort((a, b) => b.order_date.localeCompare(a.order_date));
}

export function getInventoryLogs(): InventoryLog[] {
  const db = readDb();
  return [...db.inventory_logs]
    .map((l) => ({
      ...l,
      products: l.product_id ? { name: db.products.find((p) => p.id === l.product_id)?.name ?? "?" } : null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 200);
}

export function saveProduct(
  id: string | null,
  data: Omit<Product, "id" | "created_at">,
  variants: Omit<Variant, "id" | "product_id">[],
): string {
  const db = readDb();
  let pid = id;
  if (pid) {
    const i = db.products.findIndex((p) => p.id === pid);
    if (i >= 0) {
      const prev = db.products[i]!;
      if (data.stock_quantity > prev.stock_quantity) {
        db.inventory_logs.unshift({
          id: uid(),
          product_id: pid,
          type: "Entry",
          quantity: data.stock_quantity - prev.stock_quantity,
          date: now(),
          notes: "Ajuste de stock",
          products: { name: data.name },
        });
      }
      db.products[i] = { ...prev, ...data, id: pid };
    }
  } else {
    pid = uid();
    db.products.push({ ...data, id: pid, created_at: now() });
    if (data.stock_quantity > 0) {
      db.inventory_logs.unshift({
        id: uid(),
        product_id: pid,
        type: "Entry",
        quantity: data.stock_quantity,
        date: now(),
        notes: "Stock inicial",
        products: { name: data.name },
      });
    }
  }
  db.variants = db.variants.filter((v) => v.product_id !== pid);
  for (const v of variants) {
    db.variants.push({ ...v, id: uid(), product_id: pid! });
  }
  writeDb(db);
  return pid!;
}

export function deleteProduct(id: string) {
  const db = readDb();
  db.products = db.products.filter((p) => p.id !== id);
  db.variants = db.variants.filter((v) => v.product_id !== id);
  writeDb(db);
}

export function upsertCategory(c: Partial<Category> & { id?: string; name: string; slug: string }) {
  const db = readDb();
  if (c.id) {
    const i = db.categories.findIndex((x) => x.id === c.id);
    if (i >= 0) db.categories[i] = { ...db.categories[i]!, ...c };
  } else {
    db.categories.push({
      id: uid(),
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      cover_image: c.cover_image ?? "",
      sort: c.sort ?? db.categories.length + 1,
      created_at: now(),
    });
  }
  writeDb(db);
}

export function deleteCategory(id: string) {
  const db = readDb();
  db.categories = db.categories.filter((c) => c.id !== id);
  writeDb(db);
}

export function restock(productId: string, qty: number) {
  const db = readDb();
  const p = db.products.find((x) => x.id === productId);
  if (!p || qty < 1) return;
  p.stock_quantity += qty;
  db.inventory_logs.unshift({
    id: uid(),
    product_id: productId,
    type: "Entry",
    quantity: qty,
    date: now(),
    notes: "Reabastecimiento",
    products: { name: p.name },
  });
  writeDb(db);
}

export function setOrderStatus(id: string, status: string) {
  const db = readDb();
  const o = db.orders.find((x) => x.id === id);
  if (o) o.status = status;
  writeDb(db);
}

export function placeLocalOrder(input: {
  name: string;
  email: string;
  address: string;
  items: { product_id: string; variant_id: string | null; quantity: number }[];
}): string {
  const db = readDb();
  const orderId = uid();
  const orderItems: OrderItem[] = [];
  let sub = 0;
  for (const it of input.items) {
    const p = db.products.find((x) => x.id === it.product_id && x.active);
    if (!p) throw new Error("Producto no disponible");
    if (p.stock_quantity < it.quantity) throw new Error(`Stock insuficiente para ${p.name}`);
    const v = it.variant_id ? db.variants.find((x) => x.id === it.variant_id && x.product_id === p.id) : null;
    const price = Number(p.base_price) + Number(v?.price_adjustment ?? 0);
    p.stock_quantity -= it.quantity;
    orderItems.push({
      id: uid(),
      order_id: orderId,
      product_id: p.id,
      variant_id: v?.id ?? null,
      product_name: p.name,
      variant_label: v ? `${v.color_name} · ${v.size}` : null,
      quantity: it.quantity,
      unit_price: price,
      unit_cost: Number(p.cost_price),
    });
    db.inventory_logs.unshift({
      id: uid(),
      product_id: p.id,
      type: "Sale",
      quantity: it.quantity,
      date: now(),
      notes: `Pedido ${orderId.slice(0, 8)}`,
      products: { name: p.name },
    });
    sub += price * it.quantity;
  }
  const shipping = sub >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
  db.orders.unshift({
    id: orderId,
    customer_id: null,
    customer_name: input.name,
    customer_email: input.email,
    address: input.address,
    order_date: now(),
    status: "Pending",
    subtotal: sub,
    shipping,
    total_amount: sub + shipping,
    order_items: orderItems,
  });
  writeDb(db);
  return orderId;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer la imagen"));
    r.readAsDataURL(file);
  });
}

export function getAdminPassword(): string {
  if (typeof window === "undefined") return "angel123";
  return localStorage.getItem(ADMIN_PASS_KEY) || "angel123";
}

export function setAdminPassword(pw: string) {
  localStorage.setItem(ADMIN_PASS_KEY, pw);
}

export function getLocalSession(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function localLogin(username: string, password: string): LocalUser {
  const u = username.trim().toLowerCase();
  const isAdminUser = u === "angel123" || u === "angel123@nido.app";
  if (!isAdminUser || password !== getAdminPassword()) {
    throw new Error("Usuario o contraseña incorrectos");
  }
  const user: LocalUser = {
    id: "local-admin",
    email: "angel123@nido.app",
    name: "angel123",
    role: "admin",
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("nido-auth"));
  return user;
}

export function localLogout() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event("nido-auth"));
}

export function localResetPassword(username: string, recoveryCode: string, newPassword: string) {
  const u = username.trim().toLowerCase();
  if (u !== "angel123" && u !== "angel123@nido.app") {
    throw new Error("Solo el admin demo puede recuperarse en modo beta");
  }
  if (recoveryCode.trim() !== "nido-beta") {
    throw new Error("Código incorrecto. Usa: nido-beta");
  }
  if (newPassword.length < 6) throw new Error("Mínimo 6 caracteres");
  setAdminPassword(newPassword);
}
