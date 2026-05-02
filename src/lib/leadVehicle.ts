/** Normalize car + optional root-level vehicleSnapshot from verify-otp POST body */

export interface CarData {
  title: string;
  price: string;
  vin: string;
  stock: string;
  source?: string;
  pageUrl?: string;
  vehicleSnapshot?: Record<string, unknown> | null;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Merge `car.vehicleSnapshot` with root `vehicleSnapshot` (car wins).
 * Fold top-level `car` fields into the snapshot so the DB always has one rich JSON blob.
 */
export function mergeCarPayload(car: unknown, body: Record<string, unknown>): CarData | undefined {
  if (!isPlainObject(car)) {
    if (isPlainObject(body.vehicleSnapshot)) {
      const s = body.vehicleSnapshot;
      return mergeCarPayload(
        {
          title: String(body.title ?? s.vehicle_heading ?? s.listing_title ?? ""),
          price: String(body.price ?? s.price ?? ""),
          vin: String(body.vin ?? s.vin ?? ""),
          stock: String(body.stock ?? s.stock ?? ""),
          source: body.source != null ? String(body.source) : undefined,
          pageUrl: body.pageUrl != null ? String(body.pageUrl) : undefined,
          vehicleSnapshot: s,
        },
        body,
      );
    }
    return undefined;
  }

  const fromBodySnap = isPlainObject(body.vehicleSnapshot) ? body.vehicleSnapshot : {};
  const fromCarSnap = isPlainObject(car.vehicleSnapshot) ? car.vehicleSnapshot : {};
  const mergedSnap: Record<string, unknown> = { ...fromBodySnap, ...fromCarSnap };

  const pageUrl =
    car.pageUrl != null
      ? String(car.pageUrl)
      : body.pageUrl != null
        ? String(body.pageUrl)
        : mergedSnap.embed_page_url != null
          ? String(mergedSnap.embed_page_url)
          : undefined;

  if (pageUrl) mergedSnap.embed_page_url = mergedSnap.embed_page_url ?? pageUrl;
  if (car.source != null) mergedSnap.embed_source_param = mergedSnap.embed_source_param ?? car.source;

  const title = String(car.title ?? mergedSnap.vehicle_heading ?? "");
  const vin = String(car.vin ?? mergedSnap.vin ?? "");
  const stock = String(car.stock ?? mergedSnap.stock ?? "");
  const priceRaw = car.price ?? mergedSnap.price ?? mergedSnap.msrp ?? "";
  const price = String(priceRaw !== "" && priceRaw != null ? priceRaw : "");

  if (title && mergedSnap.listing_title == null) mergedSnap.listing_title = title;
  if (vin && mergedSnap.vin == null) mergedSnap.vin = vin;
  if (stock && mergedSnap.stock == null) mergedSnap.stock = stock;
  if (price && mergedSnap.price == null) mergedSnap.price = price;

  return {
    title,
    price,
    vin,
    stock,
    source: car.source != null ? String(car.source) : body.source != null ? String(body.source) : undefined,
    pageUrl,
    vehicleSnapshot: Object.keys(mergedSnap).length > 0 ? mergedSnap : null,
  };
}

export function pickSnap(snap: Record<string, unknown> | null | undefined, keys: string[]): string {
  if (!snap) return "";
  for (const k of keys) {
    const v = snap[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

export function vehicleStatusFromType(type: string): string {
  const t = type.trim().toLowerCase();
  if (t === "new") return "new";
  if (t === "used") return "used";
  if (t === "cpo" || t === "certified") return "used";
  return "new";
}

export function safeJsonForEmail(obj: unknown, max = 40000): string {
  try {
    const s = JSON.stringify(obj, null, 2);
    return s.length > max ? `${s.slice(0, max)}\n… (truncated)` : s;
  } catch {
    return String(obj);
  }
}
