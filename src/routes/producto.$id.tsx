import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/store/SiteHeader";
import { VariantSelector } from "@/components/store/VariantSelector";
import { productsQuery } from "@/lib/store";

const SIZE_GUIDE = [
  { size: "Single", flat: "100 × 190 cm", fitted: "90 × 190 × 25 cm" },
  { size: "Double", flat: "140 × 190 cm", fitted: "120 × 190 × 25 cm" },
  { size: "Queen", flat: "160 × 200 cm", fitted: "150 × 190 × 30 cm" },
  { size: "King", flat: "200 × 200 cm", fitted: "180 × 200 × 30 cm" },
];

export const Route = createFileRoute("/producto/$id")({
  head: () => ({
    meta: [
      { title: "Producto · nido" },
      { name: "description", content: "Detalle de producto." },
      { property: "og:title", content: "Producto · nido" },
      { property: "og:description", content: "Detalle de producto." },
    ],
  }),
  component: Producto,
});

function Producto() {
  const { id } = Route.useParams();
  const { data = [], isLoading } = useQuery(productsQuery());
  const p = data.find((x) => x.id === id);
  const [img, setImg] = useState(0);

  if (!isLoading && !p) {
    return (
      <div>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-display text-3xl">Producto no encontrado</h1>
          <Link to="/tienda" className="mt-4 inline-block text-primary underline">Volver a la tienda</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const images = p?.images?.length ? p.images : [];
  const activeImg = images[Math.min(img, Math.max(images.length - 1, 0))];

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
        {p && (
          <>
            <div>
              <div className="aspect-square overflow-hidden rounded-3xl bg-muted">
                {activeImg ? (
                  <img src={activeImg} alt={p.name} className="h-full w-full object-cover transition duration-500" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">Sin imagen</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((src, k) => (
                    <button
                      key={src + k}
                      type="button"
                      onClick={() => setImg(k)}
                      className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${k === img ? "border-primary" : "border-transparent"}`}
                    >
                      <img src={src} alt="" className="h-16 w-16 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                <Link to="/tienda" search={{ category: p.categories?.slug ?? undefined }} className="hover:text-primary">
                  {p.categories?.name}
                </Link>
              </p>
              <h1 className="mt-1 font-display text-4xl">{p.name}</h1>
              <p className="mt-3 text-muted-foreground">{p.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-card p-3">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Material</dt>
                  <dd className="mt-0.5 font-medium">{p.material ?? "—"}</dd>
                </div>
                <div className="rounded-2xl bg-card p-3">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Stock</dt>
                  <dd className={`mt-0.5 font-medium ${p.stock_quantity <= p.low_stock_threshold ? "text-destructive" : ""}`}>
                    {p.stock_quantity > 0 ? `${p.stock_quantity} disponibles` : "Agotado"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6"><VariantSelector product={p} /></div>

              <details className="mt-8 rounded-3xl bg-secondary/40 p-4">
                <summary className="cursor-pointer font-display text-lg">Guía de medidas</summary>
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-1">Tamaño</th>
                      <th>Plana</th>
                      <th>Bajera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_GUIDE.map((r) => (
                      <tr key={r.size} className="border-t border-border/60">
                        <td className="py-2 font-medium">{r.size}</td>
                        <td>{r.flat}</td>
                        <td>{r.fitted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
