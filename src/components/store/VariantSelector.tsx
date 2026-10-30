import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { money, variantPrice, type ProductWithVariants } from "@/lib/store";
import { toast } from "sonner";

export function VariantSelector({ product, compact }: { product: ProductWithVariants; compact?: boolean }) {
  const variants = product.product_variants;
  const colors = useMemo(() => {
    const m = new Map<string, string>();
    variants.forEach((v) => m.set(v.color_name, v.color_hex));
    return [...m.entries()];
  }, [variants]);
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants]);
  const [color, setColor] = useState(colors[0]?.[0] ?? "");
  const [size, setSize] = useState(sizes.includes("Queen") ? "Queen" : sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  const variant = variants.find((v) => v.color_name === color && v.size === size) ?? null;
  const price = variantPrice(product, variant);
  const stock = product.stock_quantity;

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color · {color}</p>
          <div className="flex flex-wrap gap-2">
            {colors.map(([n, h]) => (
              <button
                key={n}
                title={n}
                onClick={() => setColor(n)}
                className={`h-8 w-8 rounded-full border-2 transition ${color === n ? "border-primary scale-110" : "border-border"}`}
                style={{ backgroundColor: h }}
              />
            ))}
          </div>
        </div>
      )}
      {sizes.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tamaño</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`font-display ${compact ? "text-2xl" : "text-3xl"}`}>{money(price)}</p>
          <p className={`text-xs ${stock <= product.low_stock_threshold ? "text-destructive" : "text-muted-foreground"}`}>
            {stock > 0 ? `${stock} disponibles` : "Agotado"}
          </p>
        </div>
        <div className="flex items-center rounded-full border border-border bg-card">
          <button className="p-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button className="p-2" onClick={() => setQty((q) => Math.min(stock, q + 1))} aria-label="Más">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Button
        size="lg"
        className="w-full rounded-full"
        disabled={stock < 1}
        onClick={() => {
          add({
            product_id: product.id,
            variant_id: variant?.id ?? null,
            name: product.name,
            label: variant ? `${variant.color_name} · ${variant.size}` : "",
            image: product.images[0] ?? "",
            unit_price: price,
            quantity: qty,
            max: stock,
          });
          toast.success("Agregado al carrito");
        }}
      >
        <ShoppingBag /> Agregar al carrito
      </Button>
    </div>
  );
}
