-- Activa la cuenta admin angel123 (angel123@nido.app) y confirma el correo.
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now()),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"username":"angel123"}'::jsonb
where email = 'angel123@nido.app';

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'angel123@nido.app'
on conflict (user_id, role) do nothing;

-- Por si el admin inicia sesión antes de correr el UPDATE de arriba en otro entorno
create or replace function public.ensure_bootstrap_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if coalesce(auth.jwt() ->> 'email', '') = 'angel123@nido.app'
     or coalesce(auth.jwt() -> 'user_metadata' ->> 'username', '') = 'angel123' then
    insert into public.user_roles (user_id, role)
    values (auth.uid(), 'admin')
    on conflict (user_id, role) do nothing;
    return true;
  end if;
  return false;
end;
$$;

grant execute on function public.ensure_bootstrap_admin() to authenticated;
