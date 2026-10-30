import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Category, ProductWithVariants } from "@/lib/store";
import { saveProduct } from "@/lib/local-db";
import { DropZone } from "./DropZone";
import { toast } from "sonner";

type V = { color_name: string; color_hex: string; size: string; sku: string; price_adjustment: number };

export function ProductForm({ open, onClose, product, categories }: { open: boolean; onClose: () => void; product: ProductWithVariants | null; categories: Category[] }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? categories[0]?.id ?? "",
    material: product?.material ?? "Algodón",
    base_price: Number(product?.base_price ?? 0),
    cost_price: Number(product?.cost_price ?? 0),
    stock_quantity: product?.stock_quantity ?? 0,
    low_stock_threshold: product?.low_stock_threshold ?? 5,
    active: product?.active ?? true,
    featured: product?.featured ?? false,
    images: product?.images ?? [],
  });
  const [variants, setVariants] = useState<V[]>(
    product?.product_variants.map((v) => ({ color_name: v.color_name, color_hex: v.color_hex, size: v.size, sku: v.sku ?? "", price_adjustment: Number(v.price_adjustment) })) ?? [],
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.name.trim()) { toast.error("El título es obligatorio"); return; }
    setBusy(true);
    try {
      saveProduct(
        product?.id ?? null,
        {
          name: f.name,
          description: f.description,
          category_id: f.category_id || null,
          material: f.material,
          base_price: f.base_price,
          cost_price: f.cost_price,
          stock_quantity: f.stock_quantity,
          low_stock_threshold: f.low_stock_threshold,
          active: f.active,
          featured: f.featured,
          images: f.images,
        },
        variants.map((v) => ({
          color_name: v.color_name,
          color_hex: v.color_hex,
          size: v.size,
          sku: v.sku || null,
          price_adjustment: v.price_adjustment,
          image: null,
        })),
      );
      toast.success("Producto guardado");
      qc.invalidateQueries();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  const setV = (i: number, patch: Partial<V>) => setVariants((vs) => vs.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">{product ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm">Título<Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="sm:col-span-2 text-sm">Descripción<Textarea value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <label className="text-sm">Categoría
            <select className="mt-0.5 h-9 w-full rounded-md border border-input bg-background px-2" value={f.category_id ?? ""} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Material<Input value={f.material ?? ""} onChange={(e) => setF({ ...f, material: e.target.value })} /></label>
          <label className="text-sm">Precio de venta<Input type="number" value={f.base_price} onChange={num("base_price")} /></label>
          <label className="text-sm">Costo (para margen)<Input type="number" value={f.cost_price} onChange={num("cost_price")} /></label>
          <label className="text-sm">Stock<Input type="number" value={f.stock_quantity} onChange={num("stock_quantity")} /></label>
          <label className="text-sm">Alerta bajo stock en<Input type="number" value={f.low_stock_threshold} onChange={num("low_stock_threshold")} /></label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} /> Visible en tienda</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.featured} onCheckedChange={(v) => setF({ ...f, featured: v })} /> Destacado</label>
          <div className="sm:col-span-2"><p className="mb-1 text-sm">Fotos</p><DropZone images={f.images} onChange={(images) => setF({ ...f, images })} /></div>
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm">Variantes</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setVariants([...variants, { color_name: "", color_hex: "#F3EDE2", size: "Queen", sku: "", price_adjustment: 0 }])}><Plus /> Variante</Button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr_6rem_1fr_6rem_2rem] items-center gap-1.5">
                <input type="color" value={v.color_hex} onChange={(e) => setV(i, { color_hex: e.target.value })} className="h-8 w-8 rounded" />
                <Input placeholder="Color" value={v.color_name} onChange={(e) => setV(i, { color_name: e.target.value })} />
                <select className="h-9 rounded-md border border-input bg-background px-1 text-sm" value={v.size} onChange={(e) => setV(i, { size: e.target.value })}>
                  {["Single", "Double", "Queen", "King", "Estándar"].map((s) => <option key={s}>{s}</option>)}
                </select>
                <Input placeholder="SKU" value={v.sku} onChange={(e) => setV(i, { sku: e.target.value })} />
                <Input type="number" title="Ajuste de precio" value={v.price_adjustment} onChange={(e) => setV(i, { price_adjustment: Number(e.target.value) })} />
                <button type="button" onClick={() => setVariants(variants.filter((_, k) => k !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
