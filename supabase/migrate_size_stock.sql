-- =====================================================================
-- JERSEY WALA — per-size stock update (run ONCE on your existing project)
-- Supabase -> SQL Editor -> New query -> paste ALL -> Run
-- Safe to run again. It does not delete any products or orders.
-- (If you are setting up a brand-new project, schema.sql already contains this.)
-- =====================================================================

-- 1. New column: stock for each size, e.g. {"M": 5, "L": 0, "XL": 3}
alter table public.products add column if not exists size_stock jsonb not null default '{}'::jsonb;

-- 2. Orders: only allow sizes the admin selected, and respect each size's stock.
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
  sz text;
  size_qty integer;
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

    sz := upper(left(coalesce(item->>'size', ''), 10));

    -- the size must be one the admin selected for this product
    if coalesce(array_length(prod.sizes, 1), 0) > 0 and not (sz = any(prod.sizes)) then
      raise exception 'Size % is not available for %', sz, prod.name;
    end if;

    -- stock for this size (falls back to the total for older products)
    if (prod.size_stock ->> sz) is not null then
      size_qty := (prod.size_stock ->> sz)::integer;
    else
      size_qty := prod.stock;
    end if;
    if size_qty <= 0 then
      raise exception 'Sold out: % (size %)', prod.name, sz;
    end if;

    qty := (item->>'quantity')::integer;
    if qty is null or qty < 1 or qty > least(size_qty, 10) then
      raise exception 'Invalid quantity for %', prod.name;
    end if;

    unit := case when prod.sale_price is not null and prod.sale_price < prod.price
                 then prod.sale_price else prod.price end;

    insert into public.order_items (order_id, product_id, product_name, size, quantity, unit_price)
    values (new_id, prod.id, prod.name, sz, qty, unit);

    running := running + unit * qty;
  end loop;

  update public.orders set total = running where id = new_id;
  return num;
end;
$$;

revoke all on function public.place_order(jsonb, text) from public;
grant execute on function public.place_order(jsonb, text) to anon, authenticated;

-- 3. When you Confirm / Cancel an order, update the total AND that size's stock.
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
      select product_id, size, sum(quantity)::integer as q
      from public.order_items
      where order_id = new.id and product_id is not null
      group by product_id, size
    loop
      update public.products
      set stock = greatest(stock - r.q, 0),
          size_stock = case
            when (size_stock ->> r.size) is not null
            then jsonb_set(size_stock, array[r.size], to_jsonb(greatest((size_stock ->> r.size)::integer - r.q, 0)))
            else size_stock
          end
      where id = r.product_id;
    end loop;
  elsif old.status in ('confirmed', 'shipped', 'delivered') and new.status in ('pending', 'cancelled') then
    for r in
      select product_id, size, sum(quantity)::integer as q
      from public.order_items
      where order_id = new.id and product_id is not null
      group by product_id, size
    loop
      update public.products
      set stock = stock + r.q,
          size_stock = case
            when (size_stock ->> r.size) is not null
            then jsonb_set(size_stock, array[r.size], to_jsonb((size_stock ->> r.size)::integer + r.q))
            else size_stock
          end
      where id = r.product_id;
    end loop;
  end if;
  return new;
end;
$$;

-- 4. Quick check: shows each product's selected sizes and per-size stock.
select name, sizes, size_stock, stock from public.products order by updated_at desc limit 10;
