import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/store/SiteHeader";
import { BedConfigurator } from "@/components/store/BedConfigurator";
import { productsQuery } from "@/lib/store";

export const Route = createFileRoute("/configurador")({
  head: () => ({ meta: [{ title: "Arma tu cama · nido" }, { name: "description", content: "Combina colores sobre tu cama." }, { property: "og:title", content: "Arma tu cama · nido" }, { property: "og:description", content: "Simulador de cama." }] }),
  component: () => {
    const { data = [] } = useQuery(productsQuery());
    return (
      <div>
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="mb-6 font-display text-4xl">Arma tu cama</h1>
          <BedConfigurator products={data} />
        </main>
        <SiteFooter />
      </div>
    );
  },
});
