-- ==============================================================================
-- CIVISENSE DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users for Admin & Citizen Roles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'citizen')) default 'citizen',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Service or trigger can insert profiles"
  on public.profiles for insert
  with check (true);

-- Trigger to automatically create a profile row upon Supabase Auth signup
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

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. REPORTS TABLE (Civic Complaints, AI Triage, GPS Geotags & Deduplication)
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  category text not null check (category in ('pothole', 'garbage', 'waterlogging')),
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  severity integer not null check (severity between 1 and 5),
  status text not null check (status in ('reported', 'assigned', 'in_progress', 'resolved', 'rejected')) default 'reported',
  image_url text,
  duplicate_of uuid references public.reports(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_role text default 'citizen',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists reports_category_idx on public.reports(category);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_coords_idx on public.reports(latitude, longitude);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

-- Enable RLS for reports
alter table public.reports enable row level security;

-- Public transparency: Any visitor or citizen can view active civic reports on the GIS map
create policy "Reports are viewable by everyone"
  on public.reports for select
  using (true);

-- Anyone (authenticated or guest citizen) can file a civic issue
create policy "Anyone can insert reports"
  on public.reports for insert
  with check (true);

-- Anyone or admins can update complaint status (e.g., triage / crew assignment)
create policy "Anyone can update report status"
  on public.reports for update
  using (true);

create policy "Admins can delete reports"
  on public.reports for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Enable Supabase Realtime for live GIS radar updates across open tabs
alter publication supabase_realtime add table public.reports;


-- 3. STORAGE BUCKET FOR DEFECT PHOTOGRAPHS
insert into storage.buckets (id, name, public)
values ('issue-images', 'issue-images', true)
on conflict (id) do nothing;

create policy "Public Access to Issue Images"
  on storage.objects for select
  using (bucket_id = 'issue-images');

create policy "Allow Uploads to Issue Images"
  on storage.objects for insert
  with check (bucket_id = 'issue-images');


-- 4. SEED SAMPLE INCIDENTS (Kolkata Municipal Coordinates)
insert into public.reports (category, description, latitude, longitude, severity, status, created_at)
values
  (
    'pothole',
    'Automated Computer Vision & GIS Triage: Deep asphalt crater (~42cm) observed near Park Street corridor. Severity: 4/5. High risk of two-wheeler skid. Immediate cold-mix asphalt patch dispatch recommended.',
    22.5535,
    88.3512,
    4,
    'reported',
    now() - interval '2 hours'
  ),
  (
    'waterlogging',
    'Automated Computer Vision & GIS Triage: Monsoon runoff overflow & underpass ponding (~18cm depth) near Shyambazar metro. Severity: 5/5. Dewatering suction pump deployed.',
    22.6022,
    88.3711,
    5,
    'assigned',
    now() - interval '5 hours'
  ),
  (
    'garbage',
    'Automated Computer Vision & GIS Triage: Municipal solid waste overflow on road shoulder obstructing pedestrian sidewalk near Gariahat market. Severity: 3/5. Sanitation compactor scheduled.',
    22.5192,
    88.3654,
    3,
    'resolved',
    now() - interval '2 days'
  )
on conflict do nothing;
