-- Reparix Warranty Manager (Supabase)
-- Run this in the Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  brand text,
  purchase_date date not null,
  warranty_months int not null check (warranty_months between 1 and 120),
  expiry_date date not null,
  notes text,
  invoice_url text,
  user_id text,
  created_at timestamptz not null default now()
);

create index if not exists warranties_expiry_idx on public.warranties (expiry_date);
create index if not exists warranties_product_idx on public.warranties (product_name);
create index if not exists warranties_user_idx on public.warranties (user_id);

alter table public.warranties enable row level security;

create policy "Public read warranties"
  on public.warranties
  for select
  using (true);

create policy "Public insert warranties"
  on public.warranties
  for insert
  with check (true);

create policy "Auth delete warranties"
  on public.warranties
  for delete
  to authenticated
  using (true);

-- Storage bucket (run once)
-- insert into storage.buckets (id, name, public)
-- values ('warranty-docs', 'warranty-docs', true)
-- on conflict (id) do nothing;

-- Storage policy example (public read)
-- create policy "Public read warranty docs"
--   on storage.objects for select
--   using (bucket_id = 'warranty-docs');
