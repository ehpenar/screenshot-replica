import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/store/SiteHeader";
import { VariantSelector } from "@/components/store/VariantSelector";
import { productsQuery } from "@/lib/store";

export const Route = createFileRoute("/producto/$id")({
  head: () => ({ meta: [{ title: "Producto · nido" }, { name: "description", content: "Detalle de producto." }, { property: "og:title", content: "Producto · nido" }, { property: "og:description", content: "Detalle de producto." }] }),
  component: Producto,
});

function Producto() {
  const { id } = Route.useParams();
  const { data = [] } = useQuery(productsQuery());
  const p = data.find((x) => x.id === id);
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
        {p && (
          <>
            <img src={p.images[0]} alt={p.name} className="aspect-square w-full rounded-3xl object-cover" />
            <div>
              <h1 className="font-display text-4xl">{p.name}</h1>
              <p className="mt-3 text-muted-foreground">{p.description}</p>
              <p className="mt-2 text-sm">Material: {p.material}</p>
              <p className="mt-1 text-xs text-muted-foreground">Guía: Single 100×190 · Queen 160×190 · King 200×200 cm</p>
              <div className="mt-6"><VariantSelector product={p} /></div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
