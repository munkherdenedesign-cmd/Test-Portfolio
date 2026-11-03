create table if not exists public.about_experiences (
  id integer primary key check (id = 1),
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.about_experiences enable row level security;
create policy "Public can read experiences" on public.about_experiences for select to anon, authenticated using (true);
create policy "Admin can insert experiences" on public.about_experiences for insert to authenticated with check ((auth.jwt() ->> 'email') = 'munkherdenedesign@gmail.com');
create policy "Admin can update experiences" on public.about_experiences for update to authenticated using ((auth.jwt() ->> 'email') = 'munkherdenedesign@gmail.com') with check ((auth.jwt() ->> 'email') = 'munkherdenedesign@gmail.com');
