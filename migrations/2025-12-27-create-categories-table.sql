-- Migration: create categories table for user-defined material categories
-- Run this in Supabase SQL editor

create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  value text not null,  -- unique identifier (e.g., 'custom_category')
  label text not null,  -- display name (e.g., 'Custom Category')
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, value)  -- ensure value is unique per user
);

-- Enable row level security
alter table public.categories enable row level security;

-- Policies
create policy "Users can view their own categories" on public.categories for select using (auth.uid() = user_id);
create policy "Users can insert their own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update their own categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete their own categories" on public.categories for delete using (auth.uid() = user_id);

-- Create index for faster queries
create index idx_categories_user_id on public.categories(user_id);
create index idx_categories_value on public.categories(value);
