import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, type ProductWithVariants } from "@/lib/store";

export function FeaturedCarousel({ products }: { products: ProductWithVariants[] }) {
  const list = products.filter((p) => p.featured && p.active && p.images[0]);
  const [i, setI] = useState(0);
  const n = list.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5500);
    return () => clearInterval(t);
  }, [n]);

  if (!n) return null;
  const p = list[i]!;

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-warm shadow-soft">
      <div className="relative aspect-[16/10] md:aspect-[21/9]">
        {list.map((item, k) => (
          <img
            key={item.id}
            src={item.images[0]}
            alt={item.name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="text-primary-foreground fade-up">
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">{p.categories?.name}</p>
            <h3 className="font-display text-3xl md:text-4xl">{p.name}</h3>
            <p className="mt-1 text-sm opacity-90">{money(Number(p.base_price))}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="rounded-full bg-background/95 text-foreground hover:bg-background">
              <Link to="/producto/$id" params={{ id: p.id }}>Ver producto</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/presentacion" search={{ i }}>
                <Maximize2 className="h-4 w-4" /> Ampliar / Modo presentación
              </Link>
            </Button>
          </div>
        </div>
        {n > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-soft backdrop-blur transition hover:bg-background"
              onClick={() => setI((x) => (x - 1 + n) % n)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-soft backdrop-blur transition hover:bg-background"
              onClick={() => setI((x) => (x + 1) % n)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:bottom-auto md:left-auto md:right-8 md:top-8 md:translate-x-0">
              {list.map((_, k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={`Slide ${k + 1}`}
                  onClick={() => setI(k)}
                  className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-primary-foreground" : "w-1.5 bg-primary-foreground/40"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
