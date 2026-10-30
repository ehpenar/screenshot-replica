import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/store/SiteHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { productsQuery } from "@/lib/store";

export const Route = createFileRoute("/tienda")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () => ({ meta: [{ title: "Tienda · nido" }, { name: "description", content: "Sábanas, edredones, cobijas y almohadas." }, { property: "og:title", content: "Tienda · nido" }, { property: "og:description", content: "Lencería de hogar." }] }),
  component: Tienda,
});

function Tienda() {
  const { q } = Route.useSearch();
  const { data = [] } = useQuery(productsQuery());
  const list = data.filter((p) => p.active && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-4xl">Tienda</h1>
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
