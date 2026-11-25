-- ==============================================================================
-- CIVISENSE DATABASE PERMISSIONS FIX (RUN IN SUPABASE SQL EDITOR)
-- Open: https://supabase.com/dashboard/project/ecdrkbdlbhdzglsntkcw/sql/new
-- Paste this entire script and click "Run"
-- ==============================================================================

-- 1. Grant public schema privileges to anon and authenticated API roles
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all routines in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to postgres, anon, authenticated, service_role;

-- 2. Ensure reports table schema
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  severity integer not null check (severity between 1 and 5),
  status text not null default 'reported',
  image_url text,
  duplicate_of uuid,
  user_id uuid,
  user_email text,
  user_role text default 'citizen',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Ensure profiles table schema
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'citizen',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Configure Row Level Security (RLS) policies for reports
alter table public.reports enable row level security;

drop policy if exists "Reports are viewable by everyone" on public.reports;
create policy "Reports are viewable by everyone" on public.reports for select using (true);

drop policy if exists "Anyone can insert reports" on public.reports;
create policy "Anyone can insert reports" on public.reports for insert with check (true);

drop policy if exists "Anyone can update report status" on public.reports;
create policy "Anyone can update report status" on public.reports for update using (true);

drop policy if exists "Anyone can delete reports" on public.reports;
create policy "Anyone can delete reports" on public.reports for delete using (true);

-- 5. Configure RLS policies for profiles
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are readable by everyone" on public.profiles;
create policy "Public profiles are readable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (true);

drop policy if exists "Service or trigger can insert profiles" on public.profiles;
create policy "Service or trigger can insert profiles" on public.profiles for insert with check (true);

-- 6. Trigger to automatically link Supabase Auth signups to profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'citizen')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = coalesce(excluded.role, profiles.role),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Enable Realtime on reports table
do $$
begin
  alter publication supabase_realtime add table public.reports;
exception when others then
  null; -- ignore if already added
end $$;

-- 8. Storage bucket for defect images
insert into storage.buckets (id, name, public)
values ('issue-images', 'issue-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Access to Issue Images" on storage.objects;
create policy "Public Access to Issue Images" on storage.objects for select using (bucket_id = 'issue-images');

drop policy if exists "Allow Uploads to Issue Images" on storage.objects;
create policy "Allow Uploads to Issue Images" on storage.objects for insert with check (bucket_id = 'issue-images');

-- 9. Insert Initial Seed Reports (if empty)
insert into public.reports (category, description, latitude, longitude, severity, status, created_at)
select
  'pothole',
  'Automated Computer Vision & GIS Triage: Deep asphalt crater (~42cm) observed near Park Street corridor. Severity: 4/5. High risk of two-wheeler skid. Immediate cold-mix asphalt patch dispatch recommended.',
  22.5535,
  88.3512,
  4,
  'reported',
  now() - interval '2 hours'
where not exists (select 1 from public.reports limit 1);

insert into public.reports (category, description, latitude, longitude, severity, status, created_at)
select
  'waterlogging',
  'Automated Computer Vision & GIS Triage: Monsoon runoff overflow & underpass ponding (~18cm depth) near Shyambazar metro. Severity: 5/5. Dewatering suction pump deployed.',
  22.6022,
  88.3711,
  5,
  'assigned',
  now() - interval '5 hours'
where not exists (select 1 from public.reports where category = 'waterlogging' limit 1);

insert into public.reports (category, description, latitude, longitude, severity, status, created_at)
select
  'streetlight',
  'Automated Computer Vision & GIS Triage: Non-functional sodium vapor luminaire fixture creating 35m dark zone near Sealdah flyover. Severity: 3/5.',
  22.5672,
  88.3715,
  3,
  'resolved',
  now() - interval '1 day'
where not exists (select 1 from public.reports where category = 'streetlight' limit 1);
