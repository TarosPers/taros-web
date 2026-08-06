-- =============================================
-- TAROS PERSONALSERVICE – Supabase schéma
-- Spustit v Supabase SQL editoru
-- =============================================

-- Pracovní pozice
create table public.jobs (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title_cs      text not null,
  title_de      text not null,
  description_cs text not null default '',
  description_de text not null default '',
  location      text not null,
  salary_range  text,
  type          text not null check (type in ('fulltime','parttime','temporary')),
  sector        text not null default 'other',
  active        boolean not null default true,
  og_image_url  text,
  created_at    timestamptz default now()
);

-- Žadatelé
create table public.applicants (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references public.jobs(id) on delete set null,
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  phone       text,
  message     text,
  cv_url      text,
  status      text not null default 'new'
              check (status in ('new','reviewing','invited','rejected','hired')),
  notes       text,
  created_at  timestamptz default now()
);

-- Indexy
create index idx_jobs_active  on public.jobs(active);
create index idx_jobs_slug    on public.jobs(slug);
create index idx_appl_job    on public.applicants(job_id);
create index idx_appl_status on public.applicants(status);

-- Storage bucket pro CV
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false);

-- RLS: veřejné čtení aktivních pozic
alter table public.jobs enable row level security;
create policy "public_read_active_jobs" on public.jobs
  for select using (active = true);
create policy "admin_all_jobs" on public.jobs
  for all using (auth.role() = 'authenticated');

-- RLS: žadatelé jen pro adminy
alter table public.applicants enable row level security;
create policy "admin_all_applicants" on public.applicants
  for all using (auth.role() = 'authenticated');
-- anonymní INSERT (přihlášky z webu přes service_role key v API)
create policy "anon_insert_applicants" on public.applicants
  for insert with check (true);

-- Testovací data
insert into public.jobs (slug, title_cs, title_de, description_cs, description_de, location, salary_range, type, sector) values
  ('skladnik-regen', 'Skladník', 'Lagerarbeiter', '<p>Hledáme skladníka pro práci v Regenu.</p>', '<p>Wir suchen einen Lagerarbeiter in Regen.</p>', 'Regen, DE', 'od 14 €/h', 'fulltime', 'logistics'),
  ('ridic-vzv-waldkirchen', 'Řidič VZV', 'Staplerfahrer', '<p>Hledáme řidiče vysokozdvižného vozíku.</p>', '<p>Wir suchen einen Staplerfahrer.</p>', 'Waldkirchen, DE', 'od 16 €/h', 'fulltime', 'logistics');

-- =============================================
-- MIGRACE: listing_type (standardní pozice / obecný inzerát)
-- Spustit ručně v Supabase SQL editoru
-- =============================================
alter table public.jobs
  add column if not exists listing_type text not null default 'standard'
  check (listing_type in ('standard', 'general'));
