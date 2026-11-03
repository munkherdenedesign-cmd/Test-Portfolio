-- Run once in Supabase SQL Editor to enable shared brand choices.
create table if not exists public.portfolio_brands (
  name text primary key check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);
alter table public.portfolio_brands enable row level security;
drop policy if exists "Brand catalog public read" on public.portfolio_brands;
create policy "Brand catalog public read" on public.portfolio_brands
  for select to anon, authenticated using (true);
drop policy if exists "Brand catalog admin insert" on public.portfolio_brands;
create policy "Brand catalog admin insert" on public.portfolio_brands
  for insert to authenticated with check ((select auth.jwt() ->> 'email') = 'munkherdenedesign@gmail.com');
drop policy if exists "Brand catalog admin delete" on public.portfolio_brands;
create policy "Brand catalog admin delete" on public.portfolio_brands
  for delete to authenticated using ((select auth.jwt() ->> 'email') = 'munkherdenedesign@gmail.com');
