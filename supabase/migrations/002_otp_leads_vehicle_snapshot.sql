-- Optional: full Dealer Inspire `data-vehicle` JSON (and similar) for richer reporting.
alter table public.otp_leads
  add column if not exists vehicle_snapshot jsonb;

comment on column public.otp_leads.vehicle_snapshot is 'Raw vehicle object from embedder (e.g. data-vehicle JSON)';
