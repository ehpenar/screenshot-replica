import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader } from "@/components/store/SiteHeader";
import { VariantSelector } from "@/components/store/VariantSelector";
import { productsQuery } from "@/lib/store";

export const Route = createFileRoute("/presentacion")({
  head: () => ({ meta: [{ title: "Presentación · nido" }, { name: "description", content: "Visor de catálogo." }, { property: "og:title", content: "Presentación · nido" }, { property: "og:description", content: "Visor de catálogo." }] }),
  component: Presentacion,
});

function Presentacion() {
  const { data = [] } = useQuery(productsQuery());
  const featured = data.filter((p) => p.featured && p.active);
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const p = featured[i];
  const chosen = featured.find((x) => x.id === sel);
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[2fr_1fr]">
        <div className="relative">
          {p && <img src={p.images[0]} alt={p.name} className="aspect-video w-full rounded-3xl object-cover" />}
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {featured.map((f, k) => (
              <button key={f.id} onClick={() => setI(k)} className={`shrink-0 rounded-xl border-2 ${k === i ? "border-primary" : "border-transparent"}`}>
                <img src={f.images[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-3xl bg-card p-5">
          <p className="font-display text-xl">Productos en escena</p>
          {featured.map((f) => (
            <button key={f.id} onClick={() => setSel(f.id)} className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${sel === f.id ? "bg-secondary" : ""}`}>{f.name}</button>
          ))}
          {chosen && <div className="border-t border-border pt-4"><VariantSelector key={chosen.id} product={chosen} compact /></div>}
        </div>
      </main>
    </div>
  );
}
