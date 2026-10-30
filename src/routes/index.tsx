import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/store/SiteHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { FeaturedCarousel } from "@/components/store/FeaturedCarousel";
import { categoriesQuery, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "nido · Lencería para el hogar" },
      { name: "description", content: "Sábanas, edredones, cobijas y almohadas para descansar mejor." },
      { property: "og:title", content: "nido · Lencería para el hogar" },
      { property: "og:description", content: "Confort y descanso para tu cama." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: cats = [] } = useQuery(categoriesQuery());
  const { data: prods = [] } = useQuery(productsQuery());
  const featured = prods.filter((p) => p.featured && p.active);

  return (
    <div>
      <SiteHeader />
      <section className="relative min-h-[88vh]">
        <img src="/images/hero.jpg" alt="Cama acogedora con lencería nido" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/15 to-transparent" />
        <div className="relative mx-auto flex min-h-[88vh] w-full max-w-7xl flex-col justify-end px-4 pb-14 pt-28 text-primary-foreground">
          <p className="font-display text-5xl tracking-tight md:text-7xl fade-up">
            nido<span className="text-accent">.</span>
          </p>
          <h1 className="mt-3 max-w-xl font-display text-3xl leading-tight md:text-4xl fade-up" style={{ animationDelay: "80ms" }}>
            Descanso que se siente
          </h1>
          <p className="mt-3 max-w-md text-base text-primary-foreground/90 fade-up" style={{ animationDelay: "140ms" }}>
            Sábanas, edredones y almohadas en tonos suaves para armar tu cama a tu manera.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 fade-up" style={{ animationDelay: "200ms" }}>
            <Link to="/configurador" className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Arma tu cama
            </Link>
            <Link to="/tienda" className="inline-flex rounded-full border border-primary-foreground/40 bg-background/10 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-background/20">
              Ver tienda
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4">
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl">Categorías</h2>
              <p className="mt-1 text-sm text-muted-foreground">Elige por pieza y encuentra tu textura ideal.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {cats.map((c, i) => (
              <Link
                key={c.id}
                to="/tienda"
                search={{ category: c.slug }}
                className="group fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="overflow-hidden rounded-3xl">
                  <img
                    src={c.cover_image ?? `/images/cat-${c.slug}.jpg`}
                    alt={c.name}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 font-display text-lg">{c.name}</p>
                {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-6">
            <h2 className="font-display text-3xl">Escena destacada</h2>
            <p className="mt-1 text-sm text-muted-foreground">Carrusel listo para ampliar en tablet o pantalla de showroom.</p>
          </div>
          <FeaturedCarousel products={prods} />
        </section>

        <section className="mt-20">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl">Destacados</h2>
              <p className="mt-1 text-sm text-muted-foreground">Piezas seleccionadas para combinar en tu dormitorio.</p>
            </div>
            <Link to="/tienda" className="text-sm font-medium text-primary hover:underline">Ver todo</Link>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
