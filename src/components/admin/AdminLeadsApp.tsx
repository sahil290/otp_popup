"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { OtpLeadRow } from "@/types/otpLead";

const STORAGE_KEY = "otp_admin_leads_secret";
const PAGE_SIZE = 25;
const BRAND = "#05214F";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function pickStr(s: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = s[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function fmtMoney(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isFinite(n)) return `$${n.toLocaleString("en-US")}`;
  return String(v);
}

function SpecItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const display = value?.trim() ? value : "—";
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-white/40 last:border-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:w-36 shrink-0 pt-0.5">
        {label}
      </dt>
      <dd
        className={`text-sm text-slate-800 font-medium break-words ${mono ? "font-mono text-[13px]" : ""}`}
      >
        {display}
      </dd>
    </div>
  );
}

function LeadExpandedDetail({ lead }: { lead: OtpLeadRow }) {
  const [imgFailed, setImgFailed] = useState(false);
  const snap = (lead.vehicle_snapshot ?? {}) as Record<string, unknown>;

  const heroUrl = pickStr(snap, [
    "heroImage",
    "photoUrl",
    "imageUrl",
    "primaryPhoto",
    "primary_photo",
    "thumbnail",
    "vehicle_image",
    "vehicleImage",
  ]);

  const year = pickStr(snap, ["year"]);
  const make = pickStr(snap, ["make"]);
  const model = pickStr(snap, ["model"]);
  const trim = pickStr(snap, ["trim"]);
  const vehType = pickStr(snap, ["type"]);
  const extColor = pickStr(snap, [
    "ext_color",
    "exteriorColor",
    "exterior_color",
    "color",
  ]);
  const bodystyle = pickStr(snap, ["bodystyle", "body_style"]);
  const fuel = pickStr(snap, ["fueltype", "fuel_type", "fuelType"]);
  const dateInStock = pickStr(snap, ["date_in_stock", "dateInStock"]);
  const embedPage = pickStr(snap, ["embed_page_url"]) || lead.page_url || "";
  const vin = lead.vin || pickStr(snap, ["vin"]);
  const stock = lead.stock || pickStr(snap, ["stock"]);
  const msrp = snap.msrp;
  const snapPrice = snap.price;

  const headline =
    [year, make, model].filter(Boolean).join(" ").trim() ||
    lead.vehicle_title ||
    "Vehicle";

  return (
    <div className="admin-leads-detail-shell rounded-2xl overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,280px)_1fr] xl:grid-cols-[minmax(0,300px)_1fr] gap-0 items-start">
        <div className="p-4 sm:p-5 lg:p-6 lg:pr-3 flex justify-center lg:justify-start border-b lg:border-b-0 border-white/35 bg-white/25 backdrop-blur-md lg:bg-white/20">
          <div className="relative w-full max-w-[300px] lg:max-w-none rounded-xl overflow-hidden bg-gradient-to-br from-slate-200/90 to-slate-300/90 ring-1 ring-white/40 shadow-inner backdrop-blur-sm">
            <div className="flex min-h-[132px] items-center justify-center p-3 sm:p-4">
              {heroUrl && !imgFailed ? (
                <img
                  src={heroUrl}
                  alt={headline}
                  className="h-auto max-h-[168px] sm:max-h-[192px] w-auto max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-500 text-center px-4">
                  <svg className="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.2}
                      d="M5 17l2-5h10l2 5M5 17h14v2H5v-2zm2.5-5L8 9h8l.5 3h-9z"
                    />
                  </svg>
                  <span className="text-xs font-medium">No photo</span>
                </div>
              )}
            </div>
            {vehType ? (
              <span
                className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md"
                style={{ backgroundColor: BRAND }}
              >
                {vehType}
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-5 sm:p-7 flex flex-col gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {[year, make].filter(Boolean).join(" · ") || "Vehicle"}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {model
                ? `${model}${trim ? ` ${trim}` : ""}`
                : trim && !model
                  ? trim
                  : headline}
            </h3>
            {extColor || bodystyle ? (
              <p className="text-sm text-slate-600 mt-2">
                {[extColor, bodystyle].filter(Boolean).join(" · ")}
                {fuel ? ` · ${fuel}` : ""}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-4 mt-4">
              <div
                className="rounded-xl px-4 py-3 min-w-[140px] border border-white/50 backdrop-blur-sm"
                style={{ backgroundColor: `${BRAND}14` }}
              >
                <p className="text-[10px] font-bold uppercase text-slate-500">Internet price</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: BRAND }}>
                  {fmtMoney(lead.price || snapPrice)}
                </p>
              </div>
              <div className="rounded-xl border border-white/50 bg-white/45 backdrop-blur-sm px-4 py-3 min-w-[140px]">
                <p className="text-[10px] font-bold uppercase text-slate-500">MSRP</p>
                <p className="text-lg font-bold tabular-nums text-slate-800">{fmtMoney(msrp)}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
              Vehicle identifiers
            </h4>
            <dl className="rounded-xl border border-white/55 bg-white/40 backdrop-blur-sm px-4">
              <SpecItem label="VIN" value={vin} mono />
              <SpecItem label="Stock #" value={stock} mono />
              <SpecItem label="Date in stock" value={dateInStock} />
              <SpecItem label="Source page" value={embedPage} />
            </dl>
            {embedPage.trim() ? (
              <a
                href={embedPage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold hover:underline"
                style={{ color: BRAND }}
              >
                Open listing
                <span aria-hidden>↗</span>
              </a>
            ) : null}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-xl border border-white/55 bg-white/35 backdrop-blur-sm p-4">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                Shopper
              </h4>
              <p className="font-semibold text-slate-900">
                {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—"}
              </p>
              <p className="text-sm text-slate-600 mt-1">{lead.phone}</p>
              {lead.email ? <p className="text-sm text-slate-600 mt-0.5">{lead.email}</p> : null}
              {lead.preferred_contact ? (
                <p className="text-xs mt-2">
                  <span className="text-slate-400">Prefers </span>
                  <span className="font-semibold text-slate-800">{lead.preferred_contact}</span>
                </p>
              ) : null}
              <p className="text-xs text-slate-400 mt-3">Verified {formatWhen(lead.verified_at)}</p>
            </div>
            <div className="rounded-xl border border-white/55 bg-white/35 backdrop-blur-sm p-4">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                Notes
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap min-h-[3rem]">
                {lead.comments?.trim() ? lead.comments : "No comments"}
              </p>
            </div>
          </div>

          <details className="group rounded-xl border border-white/50 bg-white/30 backdrop-blur-md open:bg-white/40 transition-colors duration-300">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-600 flex items-center justify-between gap-2 select-none [&::-webkit-details-marker]:hidden">
              <span>Technical · full snapshot (JSON)</span>
              <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-4 pb-4">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-auto max-h-56 text-[11px] leading-relaxed">
                {JSON.stringify(snap, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function leadMatchesQuery(lead: OtpLeadRow, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  const blob = [
    lead.first_name,
    lead.last_name,
    lead.phone,
    lead.email,
    lead.vin,
    lead.stock,
    lead.vehicle_title,
    lead.page_url,
    lead.comments,
    lead.preferred_contact,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blob.includes(s);
}

function downloadCsv(leads: OtpLeadRow[], filename: string) {
  const headers = [
    "created_at",
    "first_name",
    "last_name",
    "phone",
    "email",
    "preferred_contact",
    "vehicle_title",
    "price",
    "vin",
    "stock",
    "page_url",
    "verified_at",
    "comments",
  ];
  const escape = (v: string | null | undefined) => {
    const t = v == null ? "" : String(v);
    if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
    return t;
  };
  const lines = [
    headers.join(","),
    ...leads.map((r) =>
      headers
        .map((h) => escape(r[h as keyof OtpLeadRow] as string | null | undefined))
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminLeadsApp() {
  const [secretInput, setSecretInput] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [leads, setLeads] = useState<OtpLeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY);
      if (s) setSecret(s);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persistSecret = useCallback((s: string) => {
    setSecret(s);
    try {
      if (s) sessionStorage.setItem(STORAGE_KEY, s);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchLeads = useCallback(
    async (off: number, token: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/leads?limit=${PAGE_SIZE}&offset=${off}`,
          { headers: { "x-admin-secret": token } },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof json.error === "string" ? json.error : "Request failed");
          setLeads([]);
          setTotal(0);
          return;
        }
        setLeads(Array.isArray(json.leads) ? json.leads : []);
        setTotal(typeof json.total === "number" ? json.total : 0);
        setOffset(off);
      } catch {
        setError("Network error");
        setLeads([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!hydrated || !secret) return;
    fetchLeads(0, secret);
  }, [hydrated, secret, fetchLeads]);

  const filtered = useMemo(
    () => leads.filter((l) => leadMatchesQuery(l, query)),
    [leads, query],
  );

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    persistSecret(secretInput.trim());
    setSecretInput("");
  };

  const handleLogout = () => {
    persistSecret("");
    setLeads([]);
    setTotal(0);
    setOffset(0);
    setExpandedId(null);
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  if (!hydrated) {
    return (
      <div className="admin-leads-root min-h-screen text-white/90">
        <div className="admin-leads-aurora" aria-hidden />
          <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="admin-leads-login-card rounded-3xl px-10 py-8 text-center text-sm font-medium text-white/85">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="admin-leads-root min-h-screen flex items-center justify-center px-4">
        <div className="admin-leads-aurora" aria-hidden />
        <div className="relative z-10 w-full max-w-md admin-leads-login-card rounded-3xl p-8 sm:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">OTP Leads</h1>
            <p className="text-sm text-white/75 mt-2 leading-relaxed">
              Enter the admin secret from your server environment (
              <code className="text-xs bg-white/15 text-white/95 px-1.5 py-0.5 rounded-md">
                ADMIN_LEADS_SECRET
              </code>
              ).
            </p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Admin secret
              </span>
              <input
                type="password"
                autoComplete="off"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="admin-leads-input-glass mt-1.5 w-full rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={!secretInput.trim()}
              className="w-full rounded-xl py-3 font-semibold text-white disabled:opacity-45 transition-all duration-300 shadow-lg shadow-[#05214F]/40 hover:shadow-xl hover:shadow-[#05214F]/30 hover:scale-[1.01] active:scale-[0.99] motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
              style={{ backgroundColor: BRAND }}
            >
              View leads
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-leads-root min-h-screen text-slate-900 font-sans">
      <div className="admin-leads-aurora" aria-hidden />
      <header className="relative z-10 text-white admin-leads-header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-sm">Leads</h1>
            <p className="text-white/80 text-sm mt-1">
              Verified OTP submissions · {total} total
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => secret && fetchLeads(offset, secret)}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-white/25 bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(filtered, `otp-leads-${new Date().toISOString().slice(0, 10)}.csv`)}
              disabled={!filtered.length}
              className="px-4 py-2 rounded-xl bg-white/95 text-sm font-semibold disabled:opacity-40 backdrop-blur-sm border border-white/50 shadow-md transition-all duration-300 hover:bg-white hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
              style={{ color: BRAND }}
            >
              Export CSV (visible)
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/30 hover:bg-white/15 backdrop-blur-md transition-all duration-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div
            className="mb-6 rounded-2xl border border-red-400/35 bg-red-500/15 backdrop-blur-xl px-4 py-3 text-red-100 text-sm shadow-lg shadow-red-900/20"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="admin-leads-panel-glass rounded-3xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/40 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white/25 backdrop-blur-md">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter this page (name, phone, VIN, stock…)"
              className="admin-leads-input-glass w-full sm:max-w-md rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#05214F]/25"
            />
            <p className="text-xs text-slate-600 font-medium">
              Page {currentPage} of {pageCount} · Showing {filtered.length} of {leads.length} on this page
              {query.trim() ? " (filtered)" : ""}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="admin-leads-thead-glass text-slate-600 text-xs uppercase tracking-wider border-b border-white/50">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">When</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Contact</th>
                  <th className="px-4 py-3 font-semibold min-w-[200px]">Vehicle</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">VIN / Stock</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Price</th>
                  <th className="px-4 py-3 font-semibold w-24"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/35">
                {loading && !leads.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                      Loading leads…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                      {leads.length === 0
                        ? "No leads yet. Complete an OTP verification to see data here."
                        : "No rows match your filter."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const open = expandedId === lead.id;
                    return (
                      <Fragment key={lead.id}>
                        <tr className="admin-leads-row-glass align-top bg-white/15">
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {formatWhen(lead.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—"}
                            </div>
                            <div className="text-slate-500 text-xs mt-0.5">{lead.phone}</div>
                            {lead.email ? (
                              <div className="text-slate-500 text-xs truncate max-w-[180px]">
                                {lead.email}
                              </div>
                            ) : null}
                            {lead.preferred_contact ? (
                              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#05214F] bg-[#05214F]/10 px-2 py-0.5 rounded-full">
                                {lead.preferred_contact}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 line-clamp-2">
                              {lead.vehicle_title || "—"}
                            </div>
                            {lead.page_url ? (
                              <a
                                href={lead.page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#05214F] hover:underline mt-1 inline-block truncate max-w-[240px]"
                              >
                                Source page
                              </a>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-600">
                            <div className="break-all">{lead.vin || "—"}</div>
                            <div className="text-slate-500 mt-1">#{lead.stock || "—"}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {lead.price
                              ? Number.isFinite(Number(lead.price))
                                ? `$${Number(lead.price).toLocaleString()}`
                                : lead.price
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setExpandedId(open ? null : lead.id)}
                              className="text-xs font-semibold text-[#05214F] hover:underline"
                            >
                              {open ? "Hide" : "Details"}
                            </button>
                          </td>
                        </tr>
                        {open ? (
                          <tr className="bg-white/25 backdrop-blur-lg">
                            <td colSpan={6} className="px-3 sm:px-5 py-5 border-t border-white/40">
                              <LeadExpandedDetail lead={lead} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-4 border-t border-white/45 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/30 backdrop-blur-md">
            <button
              type="button"
              disabled={offset === 0 || loading}
              onClick={() => secret && fetchLeads(Math.max(0, offset - PAGE_SIZE), secret)}
              className="px-4 py-2 rounded-xl border border-white/50 bg-white/40 backdrop-blur-sm text-sm font-medium text-slate-800 disabled:opacity-40 hover:bg-white/70 transition-all duration-300"
            >
              Previous
            </button>
            <span className="text-xs text-slate-600 font-medium">
              Rows {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button
              type="button"
              disabled={offset + PAGE_SIZE >= total || loading}
              onClick={() => secret && fetchLeads(offset + PAGE_SIZE, secret)}
              className="px-4 py-2 rounded-xl border border-white/50 bg-white/40 backdrop-blur-sm text-sm font-medium text-slate-800 disabled:opacity-40 hover:bg-white/70 transition-all duration-300"
            >
              Next
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/50 max-w-lg mx-auto leading-relaxed">
          Set{" "}
          <code className="bg-white/10 text-white/85 px-1.5 py-0.5 rounded-md border border-white/15">
            ADMIN_LEADS_SECRET
          </code>{" "}
          in your deployment environment. This page is not indexed. Keep your secret private.
        </p>
      </main>
    </div>
  );
}
