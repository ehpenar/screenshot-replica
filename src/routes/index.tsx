import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/store/SiteHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "nido · Lencería para el hogar" }, { name: "description", content: "Sábanas, edredones, cobijas y almohadas para descansar mejor." }, { property: "og:title", content: "nido · Lencería para el hogar" }, { property: "og:description", content: "Confort y descanso para tu cama." }] }),
  component: Index,
});

function Index() {
  const { data: cats = [] } = useQuery(categoriesQuery());
  const { data: prods = [] } = useQuery(productsQuery());
  return (
    <div>
      <SiteHeader />
      <section className="relative">
        <img src="/images/hero.jpg" alt="Cama acogedora" className="h-[70vh] w-full object-cover" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/50 to-transparent">
          <div className="mx-auto w-full max-w-7xl px-4 pb-12 text-primary-foreground">
            <h1 className="font-display text-5xl md:text-6xl">Descansa como en casa</h1>
            <Link to="/configurador" className="mt-5 inline-block rounded-full bg-primary px-6 py-3">Arma tu cama</Link>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4">
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">
          {cats.map((c) => (
            <Link key={c.id} to="/tienda" search={{}} className="group overflow-hidden rounded-3xl">
              <img src={c.cover_image ?? ""} alt={c.name} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-105" />
              <p className="mt-2 font-display text-lg">{c.name}</p>
            </Link>
          ))}
        </div>
        <h2 className="mt-16 font-display text-3xl">Destacados</h2>
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
          {prods.filter((p) => p.featured).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
