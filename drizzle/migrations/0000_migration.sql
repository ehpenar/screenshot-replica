create type public.app_role as enum ('admin','customer');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first user becomes admin, rest customers
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  else
    insert into public.user_roles(user_id, role) values (new.id,'customer');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.categories (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text default '', cover_image text default '', sort int default 0, created_at timestamptz default now());
create table public.products (id uuid primary key default gen_random_uuid(), name text not null, description text default '', category_id uuid references public.categories(id) on delete set null, material text default 'Algodón', base_price numeric(12,2) not null default 0, cost_price numeric(12,2) not null default 0, images text[] not null default '{}', stock_quantity int not null default 0, low_stock_threshold int not null default 5, active boolean not null default true, featured boolean not null default false, created_at timestamptz default now());
create table public.product_variants (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, color_name text not null default '', color_hex text not null default '#ffffff', size text not null default 'Queen', sku text default '', price_adjustment numeric(12,2) not null default 0, image text default '');
create table public.orders (id uuid primary key default gen_random_uuid(), customer_id uuid, customer_name text not null, customer_email text not null, address text not null default '', order_date timestamptz not null default now(), status text not null default 'Pending', subtotal numeric(12,2) not null default 0, shipping numeric(12,2) not null default 0, total_amount numeric(12,2) not null default 0);
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid references public.products(id) on delete set null, variant_id uuid references public.product_variants(id) on delete set null, product_name text not null default '', variant_label text default '', quantity int not null, unit_price numeric(12,2) not null, unit_cost numeric(12,2) not null default 0);
create table public.inventory_logs (id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id) on delete cascade, type text not null check (type in ('Entry','Sale')), quantity int not null, date timestamptz not null default now(), notes text default '');

grant select on public.categories, public.products, public.product_variants to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_variants to authenticated;
grant select, insert, update, delete on public.orders, public.order_items, public.inventory_logs to authenticated;
grant all on public.categories, public.products, public.product_variants, public.orders, public.order_items, public.inventory_logs to service_role;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_logs enable row level security;

create policy "public read" on public.categories for select to anon, authenticated using (true);
create policy "admin write" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read" on public.products for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read" on public.product_variants for select to anon, authenticated using (true);
create policy "admin write" on public.product_variants for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin or own" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin') or customer_id = auth.uid());
create policy "admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.orders for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin or own" on public.order_items for select to authenticated using (public.has_role(auth.uid(),'admin') or exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));
create policy "admin all" on public.inventory_logs for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- automatic Entry log when admin adds stock
create or replace function public.log_stock_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('app.in_sale', true) = '1' then return new; end if;
  if tg_op = 'INSERT' and new.stock_quantity > 0 then
    insert into public.inventory_logs(product_id,type,quantity,notes) values (new.id,'Entry',new.stock_quantity,'Stock inicial');
  elsif tg_op = 'UPDATE' and new.stock_quantity > old.stock_quantity then
    insert into public.inventory_logs(product_id,type,quantity,notes) values (new.id,'Entry',new.stock_quantity-old.stock_quantity,'Reabastecimiento');
  end if;
  return new;
end $$;
create trigger products_stock_log after insert or update of stock_quantity on public.products for each row execute function public.log_stock_change();

-- checkout: validates prices server-side, decrements stock, logs sales
create or replace function public.place_order(_name text, _email text, _address text, _items jsonb) returns uuid language plpgsql security definer set search_path = public as $$
declare oid uuid; it jsonb; p record; v record; qty int; price numeric; sub numeric := 0; ship numeric;
begin
  if coalesce(trim(_name),'')='' or coalesce(trim(_email),'')='' then raise exception 'Nombre y correo requeridos'; end if;
  if jsonb_array_length(_items)=0 then raise exception 'Carrito vacío'; end if;
  perform set_config('app.in_sale','1',true);
  insert into public.orders(customer_id,customer_name,customer_email,address) values (auth.uid(),_name,_email,coalesce(_address,'')) returning id into oid;
  for it in select * from jsonb_array_elements(_items) loop
    qty := (it->>'quantity')::int;
    if qty is null or qty < 1 then raise exception 'Cantidad inválida'; end if;
    select * into p from public.products where id=(it->>'product_id')::uuid and active for update;
    if not found then raise exception 'Producto no disponible'; end if;
    if p.stock_quantity < qty then raise exception 'Stock insuficiente para %', p.name; end if;
    price := p.base_price;
    v := null;
    if it ? 'variant_id' and it->>'variant_id' is not null then
      select * into v from public.product_variants where id=(it->>'variant_id')::uuid and product_id=p.id;
      if found then price := price + v.price_adjustment; end if;
    end if;
    insert into public.order_items(order_id,product_id,variant_id,product_name,variant_label,quantity,unit_price,unit_cost)
      values (oid,p.id,v.id,p.name,case when v.id is null then '' else v.color_name||' · '||v.size end,qty,price,p.cost_price);
    update public.products set stock_quantity=stock_quantity-qty where id=p.id;
    insert into public.inventory_logs(product_id,type,quantity,notes) values (p.id,'Sale',qty,'Pedido '||left(oid::text,8));
    sub := sub + price*qty;
  end loop;
  ship := case when sub >= 300000 then 0 else 15000 end;
  update public.orders set subtotal=sub, shipping=ship, total_amount=sub+ship where id=oid;
  return oid;
end $$;
grant execute on function public.place_order(text,text,text,jsonb) to anon, authenticated;

-- seed
insert into public.categories(name,slug,description,cover_image,sort) values
('Sábanas','sabanas','Algodón suave y percal para noches frescas','/images/cat-sabanas.jpg',1),
('Edredones','edredones','Calidez ligera en cada estación','/images/cat-edredones.jpg',2),
('Cobijas','cobijas','Texturas acogedoras para abrazar','/images/cat-cobijas.jpg',3),
('Almohadas','almohadas','Soporte y suavidad para tu descanso','/images/cat-almohadas.jpg',4),
('Combos','combos','Juegos completos, listos para tu cama','/images/hero.jpg',5);

insert into public.products(name,description,category_id,material,base_price,cost_price,images,stock_quantity,featured) values
('Juego de Sábanas Percal 300 Hilos','Percal de algodón peinado, fresco y con caída perfecta. Incluye sábana bajera, plana y dos fundas.',(select id from categories where slug='sabanas'),'Algodón',189000,95000,'{/images/cat-sabanas.jpg}',24,true),
('Sábanas de Lino Lavado','Lino europeo prelavado con textura natural y aspecto relajado.',(select id from categories where slug='sabanas'),'Lino',329000,170000,'{/images/cat-sabanas.jpg}',8,true),
('Sábanas Microfibra Brisa','Microfibra cepillada, suave al tacto y fácil de lavar.',(select id from categories where slug='sabanas'),'Microfibra',99000,45000,'{/images/cat-sabanas.jpg}',40,false),
('Edredón Nube Reversible','Relleno hipoalergénico de fibra hueca siliconada, reversible bicolor.',(select id from categories where slug='edredones'),'Algodón',259000,130000,'{/images/cat-edredones.jpg}',12,true),
('Edredón Pluma Ligera','Sensación de pluma con relleno sintético premium, ideal todo el año.',(select id from categories where slug='edredones'),'Microfibra',349000,180000,'{/images/cat-edredones.jpg}',3,false),
('Cobija Tejida Algodón','Tejido grueso tipo waffle, perfecta a los pies de la cama.',(select id from categories where slug='cobijas'),'Algodón',149000,70000,'{/images/cat-cobijas.jpg}',18,true),
('Cobija Flannel Sherpa','Doble faz: flannel por un lado, sherpa por el otro.',(select id from categories where slug='cobijas'),'Poliéster',129000,60000,'{/images/cat-cobijas.jpg}',4,false),
('Almohada Viscoelástica','Memory foam que se adapta a tu cuello. Funda removible.',(select id from categories where slug='almohadas'),'Viscoelástica',119000,55000,'{/images/cat-almohadas.jpg}',30,true),
('Almohada Fibra Suave','Relleno de fibra siliconada, suave y esponjosa.',(select id from categories where slug='almohadas'),'Microfibra',59000,25000,'{/images/cat-almohadas.jpg}',50,false),
('Combo Descanso Total','Sábanas percal + edredón Nube + 2 almohadas fibra. Todo coordinado.',(select id from categories where slug='combos'),'Algodón',529000,280000,'{/images/hero.jpg}',6,true);

insert into public.product_variants(product_id,color_name,color_hex,size,sku,price_adjustment)
select p.id, c.n, c.h, s.sz, upper(left(p.name,3))||'-'||left(c.n,3)||'-'||s.sz, s.adj
from public.products p
cross join (values ('Marfil','#F3EDE2'),('Salvia','#A9B8A0'),('Arena','#D8C3A5'),('Rosa Polvo','#E3C2BC')) c(n,h)
cross join (values ('Single',-30000),('Queen',0),('King',40000)) s(sz,adj)
where p.name not like 'Almohada%';
insert into public.product_variants(product_id,color_name,color_hex,size,sku,price_adjustment)
select p.id,'Blanco','#FAFAF7','Estándar',upper(left(p.name,3))||'-STD',0 from public.products p where p.name like 'Almohada%';