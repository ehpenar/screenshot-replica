import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { BOOTSTRAP_USERNAME } from "@/lib/auth-credentials";
import { localLogin, localLogout, localResetPassword } from "@/lib/local-db";
import { SiteHeader } from "@/components/store/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Mode = "login" | "forgot" | "recovery";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => ({
    mode: s.mode === "forgot" || s.mode === "recovery" || s.mode === "login" ? s.mode : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cuenta · nido" },
      { name: "description", content: "Ingresa o recupera tu cuenta (modo beta local)." },
      { property: "og:title", content: "Cuenta · nido" },
      { property: "og:description", content: "Ingresa o recupera tu cuenta." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const { user, isAdmin, loading } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [identifier, setIdentifier] = useState(BOOTSTRAP_USERNAME);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (search.mode) setMode(search.mode);
  }, [search.mode]);

  const goMode = (m: Mode) => {
    setMode(m);
    navigate({ search: m === "login" ? {} : { mode: m } });
  };

  const login = async () => {
    setBusy(true);
    try {
      localLogin(identifier, pw);
      toast.success("Bienvenido (modo beta local)");
      navigate({ to: "/admin" });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  const sendReset = async () => {
    setBusy(true);
    try {
      const u = identifier.trim().toLowerCase();
      if (u !== "angel123" && u !== "angel123@nido.app") {
        throw new Error("En modo beta solo se puede recuperar el admin angel123");
      }
      toast.success("Usa el código de recuperación: nido-beta");
      goMode("recovery");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  const updatePassword = async () => {
    setBusy(true);
    try {
      if (pw !== pw2) throw new Error("Las contraseñas no coinciden");
      localResetPassword(identifier || "angel123", code || "nido-beta", pw);
      toast.success("Contraseña actualizada. Ya puedes ingresar.");
      setPw("");
      setPw2("");
      setCode("");
      goMode("login");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-sm space-y-4 px-4 py-16">
        <p className="rounded-full bg-accent/30 px-3 py-1 text-center text-xs font-medium text-accent-foreground">
          Modo beta local · sin Supabase
        </p>
        {loading ? null : user && mode !== "recovery" ? (
          <>
            <h1 className="font-display text-3xl">Tu cuenta</h1>
            <p className="text-sm text-muted-foreground">
              Sesión: <span className="text-foreground">{user.email}</span>
              {isAdmin && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>}
            </p>
            {isAdmin && (
              <Button asChild className="w-full rounded-full">
                <Link to="/admin">Ir al panel admin</Link>
              </Button>
            )}
            <Button variant="outline" className="w-full rounded-full" onClick={() => goMode("recovery")}>
              Cambiar contraseña
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { localLogout(); toast.message("Sesión cerrada"); }}>
              Cerrar sesión
            </Button>
          </>
        ) : mode === "forgot" ? (
          <>
            <h1 className="font-display text-3xl">Recuperar cuenta</h1>
            <p className="text-sm text-muted-foreground">
              En modo beta no hay correo. Confirma el usuario admin y te mostramos el código local.
            </p>
            <Input placeholder="Usuario" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" />
            <Button className="w-full rounded-full" disabled={busy || !identifier.trim()} onClick={sendReset}>
              Continuar
            </Button>
            <button type="button" className="text-sm text-primary underline" onClick={() => goMode("login")}>
              Volver a ingresar
            </button>
          </>
        ) : mode === "recovery" ? (
          <>
            <h1 className="font-display text-3xl">Nueva contraseña</h1>
            <p className="text-sm text-muted-foreground">
              Código de recuperación beta: <b className="text-foreground">nido-beta</b>
            </p>
            <Input placeholder="Usuario (angel123)" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            <Input placeholder="Código de recuperación" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input type="password" placeholder="Nueva contraseña" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
            <Input type="password" placeholder="Confirmar" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            <Button className="w-full rounded-full" disabled={busy || !pw || !pw2} onClick={updatePassword}>
              {busy ? "Guardando…" : "Guardar contraseña"}
            </Button>
            <button type="button" className="text-sm text-primary underline" onClick={() => goMode("login")}>
              Volver a ingresar
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl">Ingresar</h1>
            <Input
              placeholder="Usuario"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <Button className="w-full rounded-full" disabled={busy || !identifier || !pw} onClick={login}>
              {busy ? "Entrando…" : "Ingresar"}
            </Button>
            <button type="button" className="block w-full text-center text-sm text-primary underline" onClick={() => goMode("forgot")}>
              ¿Olvidaste tu contraseña?
            </button>
            <p className="rounded-2xl bg-secondary/50 p-3 text-xs text-muted-foreground">
              Admin beta: usuario <b className="text-foreground">angel123</b> · contraseña <b className="text-foreground">angel123</b>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
