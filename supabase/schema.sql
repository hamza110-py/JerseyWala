-- =====================================================================
-- JERSEY WALA — complete database setup (ONE script)
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste ALL -> Run
-- Safe to run again. It will not delete your products or categories.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 0. If you ran an EARLIER version of this project, upgrade it first.
--    (On a brand-new project these steps simply do nothing.)
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.admins') is not null and to_regclass('public.admin_users') is null then
    alter table public.admins rename to admin_users;
  end if;

  -- The earlier orders table had a different shape (one product per order).
  -- Only test requests could be in it, so it is replaced by the new orders + order_items.
  if to_regclass('public.orders') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'orders' and column_name = 'reference'
     ) then
    drop table public.orders cascade;
  end if;
end $$;

drop function if exists public.place_order(uuid, text, integer);

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

-- People allowed to manage the store.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  specifications text not null default '',          -- one "Label: Value" per line
  club text not null default '',
  country text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  sizes text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  is_sold_out boolean not null default false,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,     -- shown as "Popular Jerseys"
  is_retro boolean not null default false,
  is_published boolean not null default true,
  images text[] not null default '{}',               -- public image URLs, first = main image
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- for projects created with the earlier version:
alter table public.products add column if not exists country text not null default '';
alter table public.products add column if not exists is_retro boolean not null default false;

create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_club_idx on public.products (club);
create index if not exists products_country_idx on public.products (country);
create index if not exists products_category_idx on public.products (category_id);

-- Store settings: always exactly ONE row (id = 1).
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  instagram_username text not null default 'jers10ywala',
  email text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  slogan text not null default 'Wear Your Passion.',
  facebook_url text not null default '',
  tiktok_url text not null default '',
  youtube_url text not null default '',
  about_text text not null default '',
  hero_image_url text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- Orders: one row per customer cart sent to Instagram. These are ENQUIRIES:
-- they stay "pending" until YOU confirm the sale in Instagram and change the status.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  reference text not null,                           -- e.g. JW-4K9QX, also written in the DM message
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,                        -- copied at order time
  size text not null default '',
  quantity integer not null check (quantity between 1 and 10),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- Keep updated_at fresh automatically.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.store_settings;
create trigger settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. "Is this person an admin?" helper
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
--    Visitors: can only READ published products, categories and settings.
--    Visitors can NOT read, change or delete orders. They can only create an
--    enquiry through the place_order() function below.
--    Admins (listed in admin_users): can manage everything.
-- ---------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- admin_users: a logged-in user may only see their own row. Nobody can write
-- from the website; admins are added from the SQL Editor only.
drop policy if exists "admins can read own row" on public.admin_users;
drop policy if exists "admin_users read own row" on public.admin_users;
create policy "admin_users read own row" on public.admin_users
  for select to authenticated
  using (user_id = auth.uid());

-- categories
drop policy if exists "anyone can read categories" on public.categories;
create policy "anyone can read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "admins insert categories" on public.categories;
create policy "admins insert categories" on public.categories
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admins update categories" on public.categories;
create policy "admins update categories" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete categories" on public.categories;
create policy "admins delete categories" on public.categories
  for delete to authenticated using (public.is_admin());

-- products
drop policy if exists "anyone can read published products" on public.products;
create policy "anyone can read published products" on public.products
  for select to anon, authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "admins insert products" on public.products;
create policy "admins insert products" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admins update products" on public.products;
create policy "admins update products" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete products" on public.products;
create policy "admins delete products" on public.products
  for delete to authenticated using (public.is_admin());

-- store settings
drop policy if exists "anyone can read settings" on public.store_settings;
create policy "anyone can read settings" on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists "admins insert settings" on public.store_settings;
create policy "admins insert settings" on public.store_settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admins update settings" on public.store_settings;
create policy "admins update settings" on public.store_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- orders and order_items: admins only (no policy for visitors = no access)
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete orders" on public.orders;
create policy "admins delete orders" on public.orders
  for delete to authenticated using (public.is_admin());

drop policy if exists "admins read order items" on public.order_items;
create policy "admins read order items" on public.order_items
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update order items" on public.order_items;
create policy "admins update order items" on public.order_items
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete order items" on public.order_items;
create policy "admins delete order items" on public.order_items
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. How customers save an order enquiry: place_order() is the ONLY door.
--    Names and prices are read from the database, so prices cannot be faked.
--    p_items looks like: [{"product_id":"...","size":"L","quantity":2}, ...]
-- ---------------------------------------------------------------------
create or replace function public.place_order(p_items jsonb, p_ref text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  prod public.products;
  qty integer;
  unit numeric;
  new_id uuid;
  num bigint;
  running numeric := 0;
  ref text := upper(left(regexp_replace(coalesce(p_ref, ''), '[^A-Za-z0-9-]', '', 'g'), 16));
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'Invalid cart';
  end if;
  if ref = '' then
    ref := 'JW-' || upper(substr(md5(random()::text), 1, 5));
  end if;

  insert into public.orders (reference) values (ref)
  returning id, order_number into new_id, num;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into prod
    from public.products
    where id = (item->>'product_id')::uuid and is_published = true;

    if not found then
      raise exception 'Product not found';
    end if;
    if prod.is_sold_out or prod.stock <= 0 then
      raise exception 'Sold out: %', prod.name;
    end if;

    qty := (item->>'quantity')::integer;
    if qty is null or qty < 1 or qty > least(prod.stock, 10) then
      raise exception 'Invalid quantity for %', prod.name;
    end if;

    unit := case when prod.sale_price is not null and prod.sale_price < prod.price
                 then prod.sale_price else prod.price end;

    insert into public.order_items (order_id, product_id, product_name, size, quantity, unit_price)
    values (new_id, prod.id, prod.name, left(coalesce(item->>'size', ''), 10), qty, unit);

    running := running + unit * qty;
  end loop;

  update public.orders set total = running where id = new_id;
  return num;
end;
$$;

revoke all on function public.place_order(jsonb, text) from public;
grant execute on function public.place_order(jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Stock updates itself when YOU change an order's status in the admin:
--    pending/cancelled -> confirmed/shipped/delivered  = stock goes DOWN
--    confirmed/shipped/delivered -> pending/cancelled  = stock goes back UP
-- ---------------------------------------------------------------------
create or replace function public.orders_adjust_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if old.status in ('pending', 'cancelled') and new.status in ('confirmed', 'shipped', 'delivered') then
    for r in
      select product_id, sum(quantity)::integer as q
      from public.order_items
      where order_id = new.id and product_id is not null
      group by product_id
    loop
      update public.products set stock = greatest(stock - r.q, 0) where id = r.product_id;
    end loop;
  elsif old.status in ('confirmed', 'shipped', 'delivered') and new.status in ('pending', 'cancelled') then
    for r in
      select product_id, sum(quantity)::integer as q
      from public.order_items
      where order_id = new.id and product_id is not null
      group by product_id
    loop
      update public.products set stock = stock + r.q where id = r.product_id;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_stock_trigger on public.orders;
create trigger orders_stock_trigger
  after update of status on public.orders
  for each row execute function public.orders_adjust_stock();

-- ---------------------------------------------------------------------
-- 6. IMAGE STORAGE (bucket "product-images")
--    Everyone can VIEW images. Only admins can upload / replace / delete.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB per image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can view product images" on storage.objects;
create policy "public can view product images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- 7. Starter categories (rename / add / delete them in the admin later)
-- ---------------------------------------------------------------------
insert into public.categories (name, slug) values
  ('Club Jerseys', 'club-jerseys'),
  ('National Teams', 'national-teams'),
  ('Retro Classics', 'retro-classics'),
  ('Kids Kits', 'kids-kits'),
  ('Training Wear', 'training-wear')
on conflict (slug) do nothing;
