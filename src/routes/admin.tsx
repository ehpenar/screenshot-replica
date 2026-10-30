import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/store/SiteHeader";
import { useAuth } from "@/lib/auth";
import { money, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · nido" }, { name: "description", content: "Panel de administración." }, { property: "og:title", content: "Admin · nido" }, { property: "og:description", content: "Panel." }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const { data = [] } = useQuery(productsQuery());
  const low = data.filter((p) => p.stock_quantity <= p.low_stock_threshold);
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {loading ? null : !isAdmin ? (
          <p>Necesitas ser administrador.</p>
        ) : (
          <>
            <h1 className="font-display text-4xl">Panel</h1>
            <h2 className="mt-8 text-xl">Alertas de bajo stock</h2>
            <ul className="mt-2 space-y-1">
              {low.map((p) => <li key={p.id} className="text-destructive">{p.name} — {p.stock_quantity} uds</li>)}
            </ul>
            <h2 className="mt-8 text-xl">Productos</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {data.map((p) => <li key={p.id}>{p.name} · {money(Number(p.base_price))} · stock {p.stock_quantity}</li>)}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
