import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { OtpLeadRow } from "@/types/otpLead";

function checkAdminSecret(req: NextRequest): { ok: true } | { ok: false; status: number; message: string } {
  const expected = process.env.ADMIN_LEADS_SECRET?.trim();
  if (!expected) {
    return { ok: false, status: 503, message: "Admin leads are not configured (set ADMIN_LEADS_SECRET)." };
  }
  const provided =
    req.headers.get("x-admin-secret")?.trim() ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!provided || provided !== expected) {
    return { ok: false, status: 401, message: "Invalid or missing admin secret." };
  }
  return { ok: true };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-secret, Authorization",
    },
  });
}

export async function GET(req: NextRequest) {
  const auth = checkAdminSecret(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.message },
      { status: auth.status, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured (Supabase service role)." },
      { status: 503, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  const table = process.env.SUPABASE_LEADS_TABLE || "otp_leads";
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 40));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const { data, error, count } = await supabase
    .from(table)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[admin/leads]", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to load leads." },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  const leads = (data ?? []) as OtpLeadRow[];

  return NextResponse.json(
    {
      leads,
      total: count ?? leads.length,
      limit,
      offset,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
