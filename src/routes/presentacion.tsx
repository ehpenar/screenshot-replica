import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";
import { SiteHeader } from "@/components/store/SiteHeader";
import { VariantSelector } from "@/components/store/VariantSelector";
import { Button } from "@/components/ui/button";
import { money, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/presentacion")({
  validateSearch: (s: Record<string, unknown>): { i?: number } => ({
    i: typeof s.i === "number" ? s.i : typeof s.i === "string" && s.i !== "" ? Number(s.i) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Presentación · nido" },
      { name: "description", content: "Visor de catálogo en alta resolución." },
      { property: "og:title", content: "Presentación · nido" },
      { property: "og:description", content: "Visor de catálogo." },
    ],
  }),
  component: Presentacion,
});

function Presentacion() {
  const { i: start } = Route.useSearch();
  const { data = [] } = useQuery(productsQuery());
  const featured = data.filter((p) => p.featured && p.active && p.images[0]);
  const [i, setI] = useState(() => Math.min(Math.max(start ?? 0, 0), Math.max(featured.length - 1, 0)));
  const [sel, setSel] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [overlay, setOverlay] = useState(true);

  useEffect(() => {
    if (start != null && !Number.isNaN(start) && featured.length) {
      setI(Math.min(Math.max(start, 0), featured.length - 1));
    }
  }, [start, featured.length]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") setI((x) => (x + 1) % Math.max(featured.length, 1));
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + featured.length) % Math.max(featured.length, 1));
      if (e.key === "o" || e.key === "O") setOverlay((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, featured.length]);

  const p = featured[i];
  const chosen = featured.find((x) => x.id === sel) ?? (sel ? data.find((x) => x.id === sel) : null);

  const scene = (
    <div className={`relative ${fullscreen ? "h-screen w-screen" : ""}`}>
      {p ? (
        <img
          src={p.images[0]}
          alt={p.name}
          className={fullscreen ? "h-full w-full object-contain bg-foreground" : "aspect-video w-full rounded-3xl object-cover"}
        />
      ) : (
        <div className="grid aspect-video place-items-center rounded-3xl bg-muted text-muted-foreground">Sin productos destacados</div>
      )}

      {featured.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 shadow-soft backdrop-blur"
            onClick={() => setI((x) => (x - 1 + featured.length) % featured.length)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 shadow-soft backdrop-blur"
            onClick={() => setI((x) => (x + 1) % featured.length)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {overlay && p && (
        <div className={`absolute ${fullscreen ? "bottom-6 left-6 right-6 md:left-auto md:w-[22rem]" : "bottom-4 left-4 right-4 md:left-auto md:w-80"} rounded-2xl bg-background/95 p-4 shadow-soft backdrop-blur`}>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.categories?.name}</p>
          <p className="font-display text-xl">{p.name}</p>
          <p className="text-sm font-semibold">{money(Number(p.base_price))}</p>
          <p className="mt-2 text-xs text-muted-foreground">Toca un producto de la lista para variantes y carrito.</p>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-foreground text-background">
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setOverlay((v) => !v)}>
            {overlay ? "Ocultar ficha" : "Mostrar ficha"}
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full" onClick={() => setFullscreen(false)} aria-label="Salir">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {scene}
        <div className="absolute bottom-0 left-0 right-0 flex gap-2 overflow-x-auto bg-foreground/80 p-3 md:max-w-md md:rounded-tr-2xl">
          {featured.map((f, k) => (
            <button
              key={f.id}
              type="button"
              onClick={() => { setI(k); setSel(f.id); }}
              className={`shrink-0 rounded-xl border-2 ${k === i ? "border-accent" : "border-transparent"}`}
            >
              <img src={f.images[0]} alt={f.name} className="h-14 w-20 rounded-lg object-cover" />
            </button>
          ))}
        </div>
        {chosen && (
          <div className="absolute right-4 top-16 max-h-[70vh] w-[min(100%,20rem)] overflow-y-auto rounded-2xl bg-background p-4 text-foreground shadow-soft">
            <VariantSelector key={chosen.id} product={chosen} compact />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl">Modo presentación</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ideal para tablets o pantallas del showroom. Usa flechas o pantalla completa.</p>
          </div>
          <Button className="rounded-full" onClick={() => setFullscreen(true)}>
            <Maximize2 className="h-4 w-4" /> Pantalla completa
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            {scene}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {featured.map((f, k) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setI(k)}
                  className={`shrink-0 rounded-xl border-2 transition ${k === i ? "border-primary" : "border-transparent"}`}
                >
                  <img src={f.images[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-2 rounded-3xl bg-card p-5 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-xl">Productos en escena</p>
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setOverlay((v) => !v)} aria-label="Alternar overlay">
                {overlay ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
            {featured.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSel(f.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${sel === f.id ? "bg-secondary" : "hover:bg-muted/60"}`}
              >
                <img src={f.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <span className="flex-1">
                  <span className="block font-medium leading-tight">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{money(Number(f.base_price))}</span>
                </span>
              </button>
            ))}
            {chosen && (
              <div className="border-t border-border pt-4">
                <VariantSelector key={chosen.id} product={chosen} compact />
              </div>
            )}
            {!featured.length && <p className="text-sm text-muted-foreground">Marca productos como destacados en el admin.</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
