-- Enable dashboard project access for the Supabase API role.
--
-- The dashboard (app/dashboard/page.tsx) reads projects through the cookie-aware
-- server client (lib/supabase/server.ts), which authenticates as the
-- `authenticated` role. This migration:
--
--   1. Grants the `authenticated` role explicit table access (grants are
--      separate from RLS policies - both are required).
--   2. Enables Row Level Security on the dashboard tables.
--   3. Scopes every policy to the signed-in owner via auth.uid().
--   4. Creates the per-project storage bucket from a SECURITY DEFINER trigger
--      function so application code never needs a privileged server key.
--
-- The SECURITY DEFINER helper lives in the `private` schema (not exposed by
-- PostgREST) and pins `search_path` to an empty string with fully qualified
-- object names.

-- ---------------------------------------------------------------------------
-- Storage bucket creation helper (SECURITY DEFINER, non-API schema)
-- ---------------------------------------------------------------------------

create schema if not exists private;

create or replace function private.ensure_project_bucket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Idempotent: the bucket may already exist from a previous attempt.
  insert into storage.buckets (id, name, owner, owner_id, public, file_size_limit, allowed_mime_types)
  values (
    new.bucket_name,
    new.bucket_name,
    new.user_id,
    new.user_id,
    false,
    52428800, -- 50 MB, matching the previous server-side creation
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists projects_ensure_bucket on public.projects;

create trigger projects_ensure_bucket
  after insert on public.projects
  for each row
  execute function private.ensure_project_bucket();

-- ---------------------------------------------------------------------------
-- Grants for the intended API role (authenticated)
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.project_members to authenticated;

-- Project owners download their project's bundles (app/api/projects/[project_id]/bundle-mapping).
grant select on table storage.objects to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

-- ---------------------------------------------------------------------------
-- Policies - scoped to the signed-in owner via auth.uid()
-- ---------------------------------------------------------------------------

drop policy if exists "projects_select_owner" on public.projects;
create policy "projects_select_owner"
  on public.projects for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "projects_insert_owner" on public.projects;
create policy "projects_insert_owner"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "projects_update_owner" on public.projects;
create policy "projects_update_owner"
  on public.projects for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "projects_delete_owner" on public.projects;
create policy "projects_delete_owner"
  on public.projects for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "project_members_select_owner" on public.project_members;
create policy "project_members_select_owner"
  on public.project_members for select
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where public.projects.project_id = public.project_members.project_id
        and public.projects.user_id = auth.uid()
    )
  );

drop policy if exists "project_members_insert_owner" on public.project_members;
create policy "project_members_insert_owner"
  on public.project_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects
      where public.projects.project_id = public.project_members.project_id
        and public.projects.user_id = auth.uid()
    )
  );

drop policy if exists "project_members_delete_owner" on public.project_members;
create policy "project_members_delete_owner"
  on public.project_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where public.projects.project_id = public.project_members.project_id
        and public.projects.user_id = auth.uid()
    )
  );

-- Object-level reads for the project owner (used when downloading repo.bundle).
drop policy if exists "project_owners_read_bucket_objects" on storage.objects;
create policy "project_owners_read_bucket_objects"
  on storage.objects for select
  to authenticated
  using (
    exists (
      select 1 from storage.buckets
      where storage.buckets.id = storage.objects.bucket_id
        and storage.buckets.owner_id = auth.uid()
    )
  );
