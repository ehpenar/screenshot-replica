import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/store/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Cuenta · nido" }, { name: "description", content: "Ingresa a tu cuenta." }, { property: "og:title", content: "Cuenta · nido" }, { property: "og:description", content: "Ingresa a tu cuenta." }] }),
  component: Auth,
});

function Auth() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const go = async (signup: boolean) => {
    const { error } = signup
      ? await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) toast.error(error.message);
    else toast.success(signup ? "Revisa tu correo para confirmar" : "Bienvenido");
  };
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-sm space-y-3 px-4 py-16">
        {user ? (
          <>
            <p>Sesión: {user.email}</p>
            <Button onClick={() => supabase.auth.signOut()}>Cerrar sesión</Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl">Tu cuenta</h1>
            <Input placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" placeholder="Contraseña" value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => go(false)}>Ingresar</Button>
              <Button variant="outline" onClick={() => go(true)}>Crear cuenta</Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
