-- Run this in Supabase SQL Editor (or via CLI migrations).
-- Table name must match SUPABASE_LEADS_TABLE (default: otp_leads).

create table if not exists public.otp_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null default '',
  last_name text not null default '',
  phone text not null,
  email text,
  preferred_contact text,
  comments text,
  verified_at timestamptz,
  vehicle_title text,
  price text,
  vin text,
  stock text,
  page_url text,
  embed_source text
);

comment on table public.otp_leads is 'Verified OTP leads from embedded popup';
create index if not exists otp_leads_created_at_idx on public.otp_leads (created_at desc);
create index if not exists otp_leads_phone_idx on public.otp_leads (phone);
