import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { FREE_SHIPPING_FROM, money, shippingFor } from "@/lib/store";
import { placeLocalOrder } from "@/lib/local-db";
import { toast } from "sonner";

export function CartSheet() {
  const { items, open, setOpen, setQty, remove, subtotal, clear } = useCart();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const shipping = shippingFor(subtotal);

  const pay = async () => {
    setBusy(true);
    try {
      placeLocalOrder({
        name: form.name,
        email: form.email,
        address: form.address,
        items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
      });
      toast.success("¡Pedido confirmado! (modo beta local)");
      clear();
      setStep("cart");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["inventory-logs"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep("cart"); }}>
      <SheetContent className="flex w-full flex-col bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">{step === "cart" ? "Tu carrito" : "Datos de envío"}</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">Tu carrito está vacío.</p>
        ) : step === "cart" ? (
          <div className="-mx-2 flex-1 space-y-3 overflow-y-auto px-2">
            {items.map((i) => (
              <div key={i.key} className="flex gap-3 rounded-2xl bg-card p-3">
                {i.image && <img src={i.image} alt="" className="h-20 w-20 rounded-xl object-cover" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.label}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-border">
                      <button className="p-1.5" onClick={() => setQty(i.key, i.quantity - 1)}><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-xs">{i.quantity}</span>
                      <button className="p-1.5" onClick={() => setQty(i.key, i.quantity + 1)}><Plus className="h-3 w-3" /></button>
                    </div>
                    <span className="text-sm font-semibold">{money(i.unit_price * i.quantity)}</span>
                  </div>
                </div>
                <button onClick={() => remove(i.key)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Quitar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            <Input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input type="email" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Dirección de envío" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <p className="text-xs text-muted-foreground">El pago se coordina al confirmar tu pedido.</p>
          </div>
        )}
        {items.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>Envío</span><span>{shipping === 0 ? "Gratis" : money(shipping)}</span></div>
            {shipping > 0 && <p className="text-xs text-muted-foreground">Envío gratis desde {money(FREE_SHIPPING_FROM)}</p>}
            <div className="flex justify-between font-display text-xl"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
            {step === "cart" ? (
              <Button size="lg" className="w-full rounded-full" onClick={() => setStep("checkout")}>Continuar al pago</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => setStep("cart")}>Atrás</Button>
                <Button size="lg" className="flex-1 rounded-full" disabled={busy || !form.name || !form.email} onClick={pay}>
                  {busy ? "Procesando…" : "Confirmar pedido"}
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
