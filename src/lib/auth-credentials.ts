/** Bootstrap admin — Supabase exige email; el usuario inicia con el nombre corto. */
export const BOOTSTRAP_USERNAME = "angel123";
export const BOOTSTRAP_EMAIL = "angel123@nido.app";
/** Contraseña real en Auth: Supabase rechaza "angel123" (pwned). El login acepta ambas. */
export const BOOTSTRAP_AUTH_PASSWORD = "angel123nido";
export const BOOTSTRAP_LOGIN_PASSWORD = "angel123";

export function resolveAuthEmail(input: string): string {
  const v = input.trim().toLowerCase();
  if (!v) return v;
  if (v === BOOTSTRAP_USERNAME || v === BOOTSTRAP_EMAIL) return BOOTSTRAP_EMAIL;
  if (v.includes("@")) return v;
  return `${v}@nido.app`;
}

export function resolveAuthPassword(emailOrUser: string, password: string): string {
  const email = resolveAuthEmail(emailOrUser);
  if (email === BOOTSTRAP_EMAIL && password === BOOTSTRAP_LOGIN_PASSWORD) {
    return BOOTSTRAP_AUTH_PASSWORD;
  }
  return password;
}
