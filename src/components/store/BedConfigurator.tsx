import { useMemo, useState } from "react";
import { Eye, EyeOff, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { money, variantPrice, type ProductWithVariants } from "@/lib/store";
import { toast } from "sonner";

type LayerKey = "bajera" | "plana" | "fundas" | "edredon";
type Pattern = "liso" | "rayas" | "puntos" | "cuadros";
type Layer = { on: boolean; color: string; pattern: Pattern };

const LAYERS: { key: LayerKey; label: string; match: string }[] = [
  { key: "bajera", label: "Sábana bajera", match: "Sábanas" },
  { key: "plana", label: "Sábana plana", match: "Sábanas" },
  { key: "fundas", label: "Fundas de almohada", match: "Sábanas" },
  { key: "edredon", label: "Edredón", match: "Edredones" },
];

const PALETTE = [
  { name: "Marfil", hex: "#F3EDE2" },
  { name: "Salvia", hex: "#A9B8A0" },
  { name: "Arena", hex: "#D8C3A5" },
  { name: "Rosa Polvo", hex: "#E3C2BC" },
  { name: "Terracota", hex: "#C98B6B" },
  { name: "Piedra", hex: "#9C9A93" },
  { name: "Noche", hex: "#4A5160" },
];
const PATTERNS: Pattern[] = ["liso", "rayas", "puntos", "cuadros"];

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

function Fill({ id, l }: { id: string; l: Layer }) {
  const d = shade(l.color, -28);
  return (
    <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill={l.color} />
      {l.pattern === "rayas" && <rect width="6" height="24" fill={d} opacity="0.55" />}
      {l.pattern === "puntos" && <circle cx="12" cy="12" r="3" fill={d} opacity="0.6" />}
      {l.pattern === "cuadros" && (
        <>
          <rect width="24" height="8" fill={d} opacity="0.3" />
          <rect width="8" height="24" fill={d} opacity="0.3" />
        </>
      )}
    </pattern>
  );
}

export function BedConfigurator({ products }: { products: ProductWithVariants[] }) {
  const [layers, setLayers] = useState<Record<LayerKey, Layer>>({
    bajera: { on: true, color: "#F3EDE2", pattern: "liso" },
    plana: { on: true, color: "#F3EDE2", pattern: "rayas" },
    fundas: { on: true, color: "#A9B8A0", pattern: "liso" },
    edredon: { on: true, color: "#A9B8A0", pattern: "liso" },
  });
  const [active, setActive] = useState<LayerKey>("edredon");
  const { add } = useCart();
  const set = (k: LayerKey, patch: Partial<Layer>) => setLayers((s) => ({ ...s, [k]: { ...s[k], ...patch } }));

  const picks = useMemo(() => {
    const out: { layer: string; product: ProductWithVariants; variantId: string | null; label: string; price: number }[] = [];
    const seen = new Set<string>();
    for (const L of LAYERS) {
      const l = layers[L.key];
      if (!l.on) continue;
      const product = products.find((p) => p.categories?.name === L.match && p.featured && p.active && p.stock_quantity > 0);
      if (!product) continue;
      const colorName = PALETTE.find((c) => c.hex === l.color)?.name;
      const v =
        product.product_variants.find((x) => x.color_name === colorName && x.size === "Queen") ??
        product.product_variants.find((x) => x.size === "Queen") ??
        product.product_variants[0];
      const key = product.id + (v?.id ?? "");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ layer: L.label, product, variantId: v?.id ?? null, label: v ? `${v.color_name} · ${v.size}` : "", price: variantPrice(product, v) });
    }
    return out;
  }, [layers, products]);

  const total = picks.reduce((s, p) => s + p.price, 0);
  const cur = layers[active];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-3xl bg-warm shadow-soft">
        <svg viewBox="0 0 800 540" className="h-auto w-full" role="img" aria-label="Simulación de cama">
          <defs>
            {LAYERS.map((L) => <Fill key={L.key} id={`f-${L.key}`} l={layers[L.key]} />)}
            <linearGradient id="shadow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <rect width="800" height="420" fill="#EFE6D8" />
          <rect y="420" width="800" height="120" fill="#C9AE8C" />
          <rect x="40" y="250" width="70" height="120" rx="8" fill="#A9825E" />
          <ellipse cx="75" cy="235" rx="28" ry="10" fill="#F6EFE3" />
          <path d="M55 235 L65 180 L85 180 L95 235 Z" fill="#F6EFE3" />
          {/* headboard */}
          <rect x="140" y="90" width="520" height="220" rx="28" fill="#D9CBB6" />
          <rect x="155" y="105" width="490" height="190" rx="20" fill="#E4D8C5" />
          {/* bajera / mattress */}
          <rect x="120" y="270" width="560" height="190" rx="22" fill={layers.bajera.on ? "url(#f-bajera)" : "#FBFAF6"} />
          <rect x="120" y="270" width="560" height="190" rx="22" fill="url(#shadow)" />
          {/* plana */}
          {layers.plana.on && (
            <>
              <path d="M112 320 H688 V470 Q400 490 112 470 Z" fill="url(#f-plana)" />
              <rect x="112" y="320" width="576" height="26" fill={shade(layers.plana.color, -12)} opacity="0.5" />
            </>
          )}
          {/* edredon */}
          {layers.edredon.on && (
            <>
              <path d="M100 350 Q400 335 700 350 L712 490 Q400 515 88 490 Z" fill="url(#f-edredon)" />
              <path d="M100 350 Q400 335 700 350 L712 490 Q400 515 88 490 Z" fill="url(#shadow)" />
              <path d="M200 360 Q210 430 190 495 M400 352 Q405 430 400 505 M600 360 Q590 430 610 495" stroke={shade(layers.edredon.color, -20)} strokeWidth="2" fill="none" opacity="0.5" />
            </>
          )}
          {/* pillows */}
          {[195, 420].map((x) => (
            <g key={x}>
              <rect x={x} y="215" width="185" height="95" rx="40" fill={layers.fundas.on ? "url(#f-fundas)" : "#FBFAF6"} />
              <rect x={x} y="215" width="185" height="95" rx="40" fill="url(#shadow)" />
            </g>
          ))}
        </svg>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2">
          {LAYERS.map((L) => (
            <button
              key={L.key}
              onClick={() => setActive(L.key)}
              className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition ${active === L.key ? "border-primary bg-card shadow-soft" : "border-border bg-card/60"}`}
            >
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: layers[L.key].color }} />
                {L.label}
              </span>
              <span
                role="button"
                aria-label="Mostrar u ocultar"
                onClick={(e) => { e.stopPropagation(); set(L.key, { on: !layers[L.key].on }); }}
                className="text-muted-foreground hover:text-foreground"
              >
                {layers[L.key].on ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color</p>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button key={c.hex} title={c.name} onClick={() => set(active, { color: c.hex, on: true })}
                className={`h-9 w-9 rounded-full border-2 transition ${cur.color === c.hex ? "scale-110 border-primary" : "border-border"}`}
                style={{ backgroundColor: c.hex }} />
            ))}
          </div>
          <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estampado</p>
          <div className="flex flex-wrap gap-2">
            {PATTERNS.map((p) => (
              <button key={p} onClick={() => set(active, { pattern: p, on: true })}
                className={`rounded-full border px-4 py-1.5 text-sm capitalize ${cur.pattern === p ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border p-5">
          <p className="font-display text-xl">Tu combinación</p>
          <ul className="mt-3 space-y-2 text-sm">
            {picks.map((p) => (
              <li key={p.product.id + p.variantId} className="flex justify-between gap-2">
                <span>{p.product.name} <span className="text-muted-foreground">· {p.label}</span></span>
                <span className="font-medium">{money(p.price)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Las fundas vienen incluidas en el juego de sábanas.</p>
          <Button size="lg" className="mt-4 w-full rounded-full" disabled={!picks.length}
            onClick={() => {
              picks.forEach((p) => add({ product_id: p.product.id, variant_id: p.variantId, name: p.product.name, label: p.label, image: p.product.images[0] ?? "", unit_price: p.price, quantity: 1, max: p.product.stock_quantity }));
              toast.success("Combinación agregada");
            }}>
            <ShoppingBag /> Agregar todo · {money(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
