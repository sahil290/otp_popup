/** Row shape for `public.otp_leads` (Supabase). */

export interface OtpLeadRow {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  preferred_contact: string | null;
  comments: string | null;
  verified_at: string | null;
  vehicle_title: string | null;
  price: string | null;
  vin: string | null;
  stock: string | null;
  page_url: string | null;
  embed_source: string | null;
  vehicle_snapshot?: Record<string, unknown> | null;
}
