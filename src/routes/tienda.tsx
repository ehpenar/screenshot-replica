import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/store/SiteHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SIZES, categoriesQuery, money, productsQuery } from "@/lib/store";

type Search = {
  q?: string;
  category?: string;
  material?: string;
  size?: string;
  min?: number;
  max?: number;
};

export const Route = createFileRoute("/tienda")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    material: typeof s.material === "string" ? s.material : undefined,
    size: typeof s.size === "string" ? s.size : undefined,
    min: typeof s.min === "number" ? s.min : typeof s.min === "string" && s.min !== "" ? Number(s.min) : undefined,
    max: typeof s.max === "number" ? s.max : typeof s.max === "string" && s.max !== "" ? Number(s.max) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tienda · nido" },
      { name: "description", content: "Sábanas, edredones, cobijas y almohadas." },
      { property: "og:title", content: "Tienda · nido" },
      { property: "og:description", content: "Lencería de hogar." },
    ],
  }),
  component: Tienda,
});

function Tienda() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: products = [] } = useQuery(productsQuery());
  const { data: cats = [] } = useQuery(categoriesQuery());

  const materials = useMemo(
    () => [...new Set(products.map((p) => p.material).filter(Boolean) as string[])].sort(),
    [products],
  );

  const list = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (search.q && !p.name.toLowerCase().includes(search.q.toLowerCase()) && !(p.description ?? "").toLowerCase().includes(search.q.toLowerCase())) return false;
      if (search.category && p.categories?.slug !== search.category && p.category_id !== search.category) return false;
      if (search.material && p.material !== search.material) return false;
      if (search.size && !p.product_variants.some((v) => v.size === search.size)) return false;
      const price = Number(p.base_price);
      if (search.min != null && !Number.isNaN(search.min) && price < search.min) return false;
      if (search.max != null && !Number.isNaN(search.max) && price > search.max) return false;
      return true;
    });
  }, [products, search]);

  const patch = (partial: Partial<Search>) =>
    navigate({
      search: (prev) => {
        const next = { ...prev, ...partial };
        (Object.keys(next) as (keyof Search)[]).forEach((k) => {
          const v = next[k];
          if (v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v))) delete next[k];
        });
        return next;
      },
    });

  const clear = () => navigate({ search: {} });
  const hasFilters = !!(search.q || search.category || search.material || search.size || search.min != null || search.max != null);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">Tienda</h1>
            <p className="mt-1 text-sm text-muted-foreground">{list.length} productos · filtra por comodidad y medida</p>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="rounded-full" onClick={clear}>
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl bg-card p-4 shadow-soft md:grid-cols-2 lg:grid-cols-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:col-span-2">
            Buscar
            <Input
              className="mt-1"
              placeholder="Sábanas, edredón…"
              value={search.q ?? ""}
              onChange={(e) => patch({ q: e.target.value || undefined })}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categoría
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-normal text-foreground"
              value={search.category ?? ""}
              onChange={(e) => patch({ category: e.target.value || undefined })}
            >
              <option value="">Todas</option>
              {cats.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Material
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-normal text-foreground"
              value={search.material ?? ""}
              onChange={(e) => patch({ material: e.target.value || undefined })}
            >
              <option value="">Todos</option>
              {materials.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tamaño
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-normal text-foreground"
              value={search.size ?? ""}
              onChange={(e) => patch({ size: e.target.value || undefined })}
            >
              <option value="">Todos</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Precio min
              <Input
                className="mt-1"
                type="number"
                placeholder="0"
                value={search.min ?? ""}
                onChange={(e) => patch({ min: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Precio max
              <Input
                className="mt-1"
                type="number"
                placeholder={money(500000).replace(/\D/g, "").slice(0, 6)}
                value={search.max ?? ""}
                onChange={(e) => patch({ max: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => patch({ category: search.category === c.slug ? undefined : c.slug })}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${search.category === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        {!list.length && (
          <p className="mt-16 text-center text-muted-foreground">No hay productos con estos filtros. Prueba ampliar el rango.</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
