import { useEffect, useState } from "react";
import { getLocalSession, localLogout, type LocalUser } from "@/lib/local-db";

export type AuthUser = { id: string; email: string; name?: string };

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const s = getLocalSession();
      setUser(s ? { id: s.id, email: s.email, name: s.name } : null);
      setIsAdmin(s?.role === "admin");
      setLoading(false);
    };
    sync();
    window.addEventListener("nido-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nido-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    user,
    isAdmin,
    loading,
    logout: () => localLogout(),
  };
}

export type { LocalUser };
