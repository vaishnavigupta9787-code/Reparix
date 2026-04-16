-- College Lost & Found Tracker (Supabase)
-- Run this in the Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('lost','found')),
  name text not null,
  description text not null,
  location text not null,
  report_date date not null,
  email text not null,
  hide_email boolean not null default false,
  image_url text,
  user_id text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reports_kind_idx on public.reports (kind);
create index if not exists reports_date_idx on public.reports (report_date);
create index if not exists reports_location_idx on public.reports (location);
create index if not exists reports_user_idx on public.reports (user_id);

alter table public.reports enable row level security;

-- Public read
create policy "Public read reports"
  on public.reports
  for select
  using (true);

-- Public insert (server writes still enforce validation in API)
create policy "Public insert reports"
  on public.reports
  for insert
  with check (true);

-- Optional: allow deletes only for authenticated users
create policy "Auth delete reports"
  on public.reports
  for delete
  to authenticated
  using (true);

-- Storage bucket (run once)
-- insert into storage.buckets (id, name, public)
-- values ('item-images', 'item-images', true)
-- on conflict (id) do nothing;

-- Storage policy example (public read)
-- create policy "Public read item images"
--   on storage.objects for select
--   using (bucket_id = 'item-images');
