/**
 * Activa la cuenta admin angel123 en Supabase.
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=tu_secret bun scripts/activate-admin.mjs
 *
 * La key está en: Supabase Dashboard → Project Settings → API → service_role
 */
const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://nalduqkmnbdmtuewjazc.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const EMAIL = "angel123@nido.app";
const PASSWORD = "angel123nido";

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function main() {
  const list = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=200`, { headers }).then((r) => r.json());
  const users = list.users || list;
  let user = Array.isArray(users) ? users.find((u) => u.email === EMAIL) : null;

  if (!user) {
    const created = await fetch(`${URL}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { username: "angel123" },
      }),
    }).then((r) => r.json());
    if (created.error || created.msg) throw new Error(created.error || created.msg || JSON.stringify(created));
    user = created;
    console.log("Usuario creado:", user.id);
  } else {
    const updated = await fetch(`${URL}/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        email_confirm: true,
        password: PASSWORD,
        user_metadata: { ...(user.user_metadata || {}), username: "angel123" },
      }),
    }).then((r) => r.json());
    if (updated.error || updated.msg) throw new Error(updated.error || updated.msg || JSON.stringify(updated));
    user = updated;
    console.log("Usuario confirmado/actualizado:", user.id);
  }

  const role = await fetch(`${URL}/rest/v1/user_roles`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ user_id: user.id, role: "admin" }),
  }).then((r) => r.text());
  console.log("Rol admin:", role || "ok");

  const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  }).then((r) => r.json());
  if (login.access_token) console.log("Login OK — usa usuario angel123 / contraseña angel123 en /auth");
  else console.error("Login falló:", login);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
