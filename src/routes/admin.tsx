import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2, PackagePlus } from "lucide-react";
import { SiteHeader } from "@/components/store/SiteHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductForm } from "@/components/admin/ProductForm";
import { DropZone } from "@/components/admin/DropZone";
import { useAuth } from "@/lib/auth";
import { categoriesQuery, money, productsQuery, type Category, type ProductWithVariants } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · nido" }, { name: "description", content: "Panel de administración." }, { property: "og:title", content: "Admin · nido" }, { property: "og:description", content: "Panel." }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading, user } = useAuth();
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading ? null : !isAdmin ? (
          <div className="py-20 text-center">
            <p className="text-lg">{user ? "Tu cuenta no tiene permisos de administrador." : "Inicia sesión como administrador."}</p>
            {!user && <Link to="/auth" className="mt-3 inline-block text-primary underline">Ir a mi cuenta</Link>}
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl">Panel de administración</h1>
            <Tabs defaultValue="metricas" className="mt-6">
              <TabsList className="flex-wrap">
                <TabsTrigger value="metricas">Métricas</TabsTrigger>
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="categorias">Categorías</TabsTrigger>
                <TabsTrigger value="inventario">Inventario</TabsTrigger>
                <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
              </TabsList>
              <TabsContent value="metricas"><Metrics /></TabsContent>
              <TabsContent value="productos"><Products /></TabsContent>
              <TabsContent value="categorias"><Categories /></TabsContent>
              <TabsContent value="inventario"><Inventory /></TabsContent>
              <TabsContent value="pedidos"><Orders /></TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

const ordersQuery = {
  queryKey: ["admin-orders"],
  queryFn: async () => {
    const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("order_date", { ascending: false });
    if (error) throw error;
    return data;
  },
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function LowStock() {
  const { data = [] } = useQuery(productsQuery());
  const low = data.filter((p) => p.stock_quantity <= p.low_stock_threshold);
  if (!low.length) return null;
  return (
    <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-5">
      <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Bajo stock — reabastecer</p>
      <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        {low.map((p) => <li key={p.id}>{p.name}: <b>{p.stock_quantity}</b> uds (mín. {p.low_stock_threshold})</li>)}
      </ul>
    </div>
  );
}

function Metrics() {
  const [days, setDays] = useState(30);
  const { data: orders = [] } = useQuery(ordersQuery);
  const m = useMemo(() => {
    const from = days ? Date.now() - days * 864e5 : 0;
    const list = orders.filter((o) => new Date(o.order_date).getTime() >= from);
    let gross = 0, units = 0, cost = 0;
    const byProduct = new Map<string, number>();
    list.forEach((o) => o.order_items.forEach((i) => {
      gross += Number(i.unit_price) * i.quantity;
      cost += Number(i.unit_cost) * i.quantity;
      units += i.quantity;
      byProduct.set(i.product_name, (byProduct.get(i.product_name) ?? 0) + i.quantity);
    }));
    const revenue = list.reduce((s, o) => s + Number(o.total_amount), 0);
    return { count: list.length, revenue, gross, units, margin: gross - cost, pct: gross ? ((gross - cost) / gross) * 100 : 0, top: [...byProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5) };
  }, [orders, days]);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex gap-2">
        {[7, 30, 90, 0].map((d) => (
          <Button key={d} size="sm" variant={days === d ? "default" : "outline"} className="rounded-full" onClick={() => setDays(d)}>{d ? `${d} días` : "Todo"}</Button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total de ventas" value={String(m.count)} sub="pedidos" />
        <Stat label="Ingresos brutos" value={money(m.gross)} sub={`${money(m.revenue)} con envíos`} />
        <Stat label="Productos vendidos" value={String(m.units)} sub="unidades" />
        <Stat label="Margen estimado" value={money(m.margin)} sub={`${m.pct.toFixed(1)}% sobre ventas`} />
      </div>
      <LowStock />
      <div className="rounded-3xl bg-card p-5">
        <p className="font-display text-xl">Más vendidos</p>
        {m.top.length ? (
          <ul className="mt-3 space-y-2">
            {m.top.map(([n, q]) => (
              <li key={n} className="text-sm">
                <div className="flex justify-between"><span>{n}</span><span>{q} uds</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(q / m.top[0][1]) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">Aún no hay ventas en este periodo.</p>}
      </div>
    </div>
  );
}

function Products() {
  const { data = [] } = useQuery(productsQuery());
  const { data: cats = [] } = useQuery(categoriesQuery());
  const [edit, setEdit] = useState<ProductWithVariants | null | "new">(null);
  const qc = useQueryClient();
  const del = async (p: ProductWithVariants) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Eliminado"); qc.invalidateQueries(); }
  };
  return (
    <div className="pt-4">
      <Button onClick={() => setEdit("new")} className="rounded-full"><Plus /> Nuevo producto</Button>
      <div className="mt-4 overflow-x-auto rounded-3xl bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Variantes</th><th>Estado</th><th /></tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="flex items-center gap-3 p-3">
                  {p.images[0] && <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />}{p.name}
                </td>
                <td>{p.categories?.name}</td>
                <td>{money(Number(p.base_price))}</td>
                <td className={p.stock_quantity <= p.low_stock_threshold ? "font-semibold text-destructive" : ""}>{p.stock_quantity}</td>
                <td>{p.product_variants.length}</td>
                <td>{p.active ? "Visible" : "Oculto"}</td>
                <td className="whitespace-nowrap pr-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEdit(p)} aria-label="Editar"><Pencil /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(p)} aria-label="Eliminar"><Trash2 /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <ProductForm key={edit === "new" ? "new" : edit.id} open product={edit === "new" ? null : edit} categories={cats} onClose={() => setEdit(null)} />}
    </div>
  );
}

function CategoryRow({ c }: { c: Category }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: c.name, description: c.description ?? "", cover_image: c.cover_image ?? "" });
  const save = async (patch = f) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) toast.error(error.message); else { toast.success("Categoría guardada"); qc.invalidateQueries(); }
  };
  const del = async () => {
    if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) toast.error(error.message); else qc.invalidateQueries();
  };
  return (
    <div className="grid gap-3 rounded-3xl bg-card p-4 md:grid-cols-[14rem_1fr]">
      <DropZone multiple={false} images={f.cover_image ? [f.cover_image] : []} onChange={(imgs) => { const n = { ...f, cover_image: imgs[0] ?? "" }; setF(n); save(n); }} />
      <div className="space-y-2">
        <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input value={f.description} placeholder="Descripción" onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => save()}>Guardar</Button>
          <Button size="sm" variant="ghost" onClick={del}><Trash2 /> Eliminar</Button>
        </div>
      </div>
    </div>
  );
}

function Categories() {
  const { data = [] } = useQuery(categoriesQuery());
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const create = async () => {
    if (!name.trim()) return;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("categories").insert({ name, slug, sort: data.length + 1 });
    if (error) toast.error(error.message); else { setName(""); qc.invalidateQueries(); }
  };
  return (
    <div className="space-y-4 pt-4">
      <div className="flex max-w-md gap-2">
        <Input placeholder="Nueva categoría" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={create}><Plus /> Crear</Button>
      </div>
      {data.map((c) => <CategoryRow key={c.id} c={c} />)}
    </div>
  );
}

function Inventory() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery(productsQuery());
  const { data: logs = [] } = useQuery({
    queryKey: ["inventory-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory_logs").select("*, products(name)").order("date", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState(10);
  const restock = async () => {
    const p = products.find((x) => x.id === pid);
    if (!p || qty < 1) return;
    const { error } = await supabase.from("products").update({ stock_quantity: p.stock_quantity + qty }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Entrada registrada"); qc.invalidateQueries(); }
  };
  return (
    <div className="space-y-6 pt-4">
      <LowStock />
      <div className="flex flex-wrap items-end gap-2 rounded-3xl bg-card p-4">
        <label className="text-sm">Producto
          <select className="mt-0.5 block h-9 rounded-md border border-input bg-background px-2" value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="">Selecciona…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity})</option>)}
          </select>
        </label>
        <label className="text-sm">Cantidad<Input type="number" className="w-24" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
        <Button onClick={restock} disabled={!pid}><PackagePlus /> Registrar entrada</Button>
      </div>
      <div className="overflow-x-auto rounded-3xl bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Nota</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-3">{new Date(l.date).toLocaleString("es-CO")}</td>
                <td>{l.products?.name}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs ${l.type === "Entry" ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"}`}>{l.type === "Entry" ? "Entrada" : "Salida"}</span></td>
                <td>{l.type === "Entry" ? "+" : "−"}{l.quantity}</td>
                <td className="text-muted-foreground">{l.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Orders() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(ordersQuery);
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };
  if (!data.length) return <p className="pt-6 text-muted-foreground">Aún no hay pedidos.</p>;
  return (
    <div className="space-y-3 pt-4">
      {data.map((o) => (
        <div key={o.id} className="rounded-3xl bg-card p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p><b>{o.customer_name}</b> · {o.customer_email} · {new Date(o.order_date).toLocaleDateString("es-CO")}</p>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{money(Number(o.total_amount))}</span>
              <select className="h-8 rounded-md border border-input bg-background px-2" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                <option value="Pending">Pendiente</option><option value="Shipped">Enviado</option><option value="Delivered">Entregado</option>
              </select>
            </div>
          </div>
          <p className="mt-1 text-muted-foreground">{o.order_items.map((i) => `${i.quantity}× ${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ""}`).join(", ")}</p>
        </div>
      ))}
    </div>
  );
}
