-- Migration: add filename and storage_path to materials, migrate title -> filename, and make title nullable
-- Run this in Supabase SQL editor. Backup recommended.

alter table public.materials add column if not exists filename text;
alter table public.materials add column if not exists storage_path text;

-- migrate existing title values into filename when filename is null
update public.materials
set filename = title
where filename is null and title is not null;

-- optionally make title nullable if you no longer want it required
alter table public.materials alter column title drop not null;

-- add index for storage_path for faster deletes/lookup
create index if not exists idx_materials_storage_path on public.materials(storage_path);




