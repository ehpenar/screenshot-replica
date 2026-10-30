import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { CartSheet } from "./CartSheet";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight">nido<span className="text-primary">.</span></Link>
          <nav className="hidden gap-5 text-sm md:flex">
            <Link to="/tienda" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Tienda</Link>
            <Link to="/configurador" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Arma tu cama</Link>
            <Link to="/presentacion" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Presentación</Link>
          </nav>
          <form
            className="ml-auto flex flex-1 items-center rounded-full border border-border bg-card px-3 md:max-w-xs"
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/tienda", search: { q: q || undefined } }); }}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="w-full bg-transparent px-2 py-2 text-sm outline-none" />
          </form>
          {isAdmin && <Link to="/admin" className="hidden text-sm font-medium text-primary sm:block">Admin</Link>}
          <Link to="/auth" aria-label="Cuenta" className="rounded-full p-2 hover:bg-secondary">
            <User className={`h-5 w-5 ${user ? "text-primary" : ""}`} />
          </Link>
          <button onClick={() => setOpen(true)} className="relative rounded-full p-2 hover:bg-secondary" aria-label="Carrito">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{count}</span>
            )}
          </button>
        </div>
        <nav className="flex justify-center gap-5 pb-2 text-sm md:hidden">
          <Link to="/tienda">Tienda</Link>
          <Link to="/configurador">Arma tu cama</Link>
          <Link to="/presentacion">Presentación</Link>
        </nav>
      </header>
      <CartSheet />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p className="font-display text-lg text-foreground">nido. <span className="text-sm text-muted-foreground">lencería para el hogar</span></p>
        <p>Envío gratis en compras superiores a $300.000</p>
      </div>
    </footer>
  );
}
