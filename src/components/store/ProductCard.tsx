import { Link } from "@tanstack/react-router";
import { money, type ProductWithVariants } from "@/lib/store";

export function ProductCard({ p }: { p: ProductWithVariants }) {
  const colors = [...new Map(p.product_variants.map((v) => [v.color_name, v.color_hex])).values()];
  return (
    <Link to="/producto/$id" params={{ id: p.id }} className="group block">
      <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
        {p.images[0] && (
          <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.categories?.name}</p>
          <h3 className="font-display text-lg leading-tight">{p.name}</h3>
          <div className="mt-1.5 flex gap-1">
            {colors.slice(0, 5).map((c) => <span key={c} className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: c }} />)}
          </div>
        </div>
        <p className="whitespace-nowrap font-semibold">{money(Number(p.base_price))}</p>
      </div>
      {p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0 && (
        <p className="mt-1 text-xs text-destructive">¡Últimas {p.stock_quantity} unidades!</p>
      )}
    </Link>
  );
}
