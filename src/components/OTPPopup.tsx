"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface UserData {
  firstName: string;
  lastName: string;
  preferredContact: string;
  phone: string;
  email: string;
  comments: string;
  verifiedAt: string;
  name?: string;
}

interface CarData {
  title: string;
  price: string;
  vin: string;
  stock: string;
  /** Optional tag from query (?source=) — not the parent page URL */
  source: string;
  /** WordPress / embedder page URL */
  pageUrl: string;
  /** Full vehicle payload from parent (e.g. Dealer Inspire `data-vehicle` JSON) */
  vehicleSnapshot?: Record<string, unknown> | null;
}

export interface OTPVerifySuccessPayload {
  user: UserData;
  car: CarData;
}

function pickSnapshotStr(
  snap: Record<string, unknown> | null | undefined,
  keys: string[]
): string {
  if (!snap) return "";
  for (const k of keys) {
    const v = snap[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function formatListPrice(raw: string): string {
  if (!raw) return "";
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return raw.trim();
  return n.toLocaleString("en-US");
}

function buildMileageLabel(raw: string): string {
  if (!raw) return "";
  const s = raw.trim();
  if (/mile/i.test(s)) return s;
  if (/^\d[\d,]*$/.test(s))
    return `${Number(s.replace(/,/g, "")).toLocaleString("en-US")} miles`;
  return s;
}

type SidebarStep = "form" | "otp" | "success";

function VehicleSidebarPanel({
  carData,
  step,
}: {
  carData: CarData;
  step: SidebarStep;
}) {
  const snap = carData.vehicleSnapshot ?? undefined;
  const imageUrl = pickSnapshotStr(snap, [
    "photoUrl",
    "photoURL",
    "imageUrl",
    "image_url",
    "image",
    "primaryPhoto",
    "primary_photo",
    "thumbnail",
    "heroImage",
    "hero_image",
    "stock_photo",
    "stockPhoto",
    "vehicle_image",
    "vehicleImage",
    "mainPhoto",
    "main_photo",
    "primary_image_url",
    "img",
  ]);
  const year = pickSnapshotStr(snap, ["year"]);
  const make = pickSnapshotStr(snap, ["make"]);
  const model = pickSnapshotStr(snap, ["model"]);
  const trim = pickSnapshotStr(snap, ["trim"]);
  const modelTrim = [model, trim].filter(Boolean).join(" ").trim();
  const mileage = buildMileageLabel(
    pickSnapshotStr(snap, ["mileage", "odometer", "miles", "odometerReading"])
  );
  const color = pickSnapshotStr(snap, [
    "exterior_color",
    "exteriorColor",
    "ext_color",
    "extColor",
    "color",
    "paint",
    "exterior",
  ]);
  const snapStock = pickSnapshotStr(snap, ["stock", "stockNumber", "stock_number"]);
  const stockLine = (carData.stock || snapStock || "").trim();
  const metaLine = [mileage, color].filter(Boolean).join(" • ");
  const yearMake = [year, make].filter(Boolean).join(" ").trim();

  const priceFormatted = formatListPrice(carData.price);
  const introForm =
    (priceFormatted ? `Listed at $${priceFormatted}. ` : "") +
    "Please provide your contact information to reveal this vehicle's Instant Price.";
  const introOtp =
    "Enter the code we sent to verify and unlock this vehicle's Instant Price.";
  const introSuccess =
    "You're verified. Your Instant Price is ready on the vehicle listing.";
  const intro =
    step === "form" ? introForm : step === "otp" ? introOtp : introSuccess;

  const titleFallback = (carData.title || "").trim();
  const showCard =
    Boolean(imageUrl) ||
    Boolean(yearMake) ||
    Boolean(modelTrim) ||
    Boolean(metaLine) ||
    Boolean(titleFallback) ||
    Boolean(carData.vin) ||
    Boolean(stockLine);

  const [imgBroken, setImgBroken] = useState(false);
  useEffect(() => {
    setImgBroken(false);
  }, [imageUrl]);

  const imgAlt =
    [year, make, model].filter(Boolean).join(" ").trim() ||
    titleFallback ||
    "Vehicle";

  return (
    <div className="otp-sidebar">
      <div className="otp-sidebar-inner">
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              background: "#fff",
              padding: "10px 16px",
              borderRadius: 10,
              display: "inline-block",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            <img
              src="https://di-uploads-development.dealerinspire.com/amford/uploads/2025/08/Am-ford.png"
              alt="Dealer logo"
              style={{
                height: 42,
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>

        <p className="otp-sidebar-intro">{intro}</p>

        {showCard ? (
          <div className="otp-vehicle-card">
            <div className="otp-vehicle-card-media">
              {imageUrl && !imgBroken ? (
                <img
                  src={imageUrl}
                  alt={imgAlt}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgBroken(true)}
                />
              ) : (
                <div className="otp-vehicle-card-placeholder" aria-hidden>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 17l2-5h10l2 5M5 17h14v2H5v-2zm2.5-5L8 9h8l.5 3h-9z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="otp-vehicle-card-body">
              {yearMake ? (
                <div className="otp-vehicle-card-year-make">{yearMake}</div>
              ) : null}
              <div className="otp-vehicle-card-model">
                {modelTrim || titleFallback || "Your selected vehicle"}
              </div>
              {metaLine ? (
                <div className="otp-vehicle-card-meta">{metaLine}</div>
              ) : null}
              {stockLine ? (
                <div
                  className="otp-vehicle-card-meta"
                  style={{ marginTop: metaLine ? 6 : 0, fontSize: 12 }}
                >
                  Stock #{stockLine}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {carData.source ? (
          <div
            style={{
              marginTop: 16,
              fontSize: 10,
              color: "#ffffff44",
              wordBreak: "break-all",
            }}
          >
            Source: {carData.source}
          </div>
        ) : null}
      </div>

      <div className="desktop-only otp-powered-by">
        <div style={{ color: "#ffffff55", fontSize: 11 }}>Powered by</div>
        <div
          style={{
            color: "#ffffff99",
            fontSize: 13,
            fontWeight: 600,
            fontStyle: "italic",
          }}
        >
          AM Ford
        </div>
      </div>
    </div>
  );
}

interface OTPPopupProps {
  onSuccess?: (data: OTPVerifySuccessPayload) => void;
  onClose?: () => void;
  apiBase?: string;
}

type Step = "form" | "otp" | "success";

function formatE164(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  return "+" + digits;
}

const BRAND = "#05214F";
const BRAND_LIGHT = "#e8edf5";

export default function OTPPopup({ onSuccess, onClose, apiBase = "" }: OTPPopupProps) {
  const [step, setStep] = useState<Step>("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredContact, setPreferredContact] = useState("Text");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [cleanPhone, setCleanPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [resendTimer, setResendTimer] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [carData, setCarData] = useState<CarData>({
    title: "",
    price: "",
    vin: "",
    stock: "",
    source: "",
    pageUrl: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer || "";
    setCarData({
      title: params.get("vehicle") || params.get("title") || "",
      price: params.get("price") || "",
      vin: params.get("vin") || "",
      stock: params.get("stock") || "",
      source: params.get("source") || "",
      pageUrl:
        params.get("page_url") ||
        params.get("pageUrl") ||
        params.get("referrer") ||
        referrer ||
        "",
    });
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.type !== "OTP_EMBED_CONTEXT") return;
      const str = (v: unknown) => (typeof v === "string" ? v : "");
      setCarData((prev) => {
        const snap =
          d.vehicleData != null && typeof d.vehicleData === "object" && !Array.isArray(d.vehicleData)
            ? (d.vehicleData as Record<string, unknown>)
            : prev.vehicleSnapshot;
        return {
          title: str(d.vehicle) || str(d.title) || prev.title,
          price: str(d.price) || prev.price,
          vin: str(d.vin) || prev.vin,
          stock: str(d.stock) || prev.stock,
          source: str(d.source) || prev.source,
          pageUrl: str(d.pageUrl) || str(d.page_url) || prev.pageUrl,
          vehicleSnapshot: snap ?? prev.vehicleSnapshot,
        };
      });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startResendTimer = () => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const sendOTP = async (normalized: string) => {
    const res = await fetch(`${apiBase}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalized }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send OTP");
    if (data.dev) setDevMode(true);
    return data;
  };

  const handleSendOTP = async () => {
    setError("");
    setInvalidFields([]);

    const errors: string[] = [];
    if (!firstName.trim()) errors.push("firstName");
    if (!phone.trim()) errors.push("phone");

    // Validation removed for testing as requested

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("email");
    }

    if (errors.length > 0) {
      setInvalidFields(errors);
      // Reset after animation finishes so it can re-trigger
      setTimeout(() => setInvalidFields([]), 410);
      return;
    }

    setLoading(true);
    try {
      await sendOTP(phone); // Send raw phone to let API handle normalization
      setCleanPhone(formatE164(phone));
      setStep("otp");
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOTP = async () => {
    setError("");
    const otpString = otp.join("");
    if (otpString.length !== 6) return setError("Please enter the complete 6-digit code.");

    setLoading(true);
    try {
      const payload = {
        user: {
          name: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          phone: cleanPhone,
          email,
          preferredContact,
          comments,
          verifiedAt: new Date().toISOString()
        },
        car: carData,
        otp: otpString // Keep OTP for verification logic
      };

      const res = await fetch(`${apiBase}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      const userData: UserData = payload.user;

      console.log("OTP Verification successful. UserData:", userData);

      try { sessionStorage.setItem("otp_verified_user", JSON.stringify(userData)); } catch (_) { }

      setStep("success");
      onSuccess?.({ user: userData, car: carData });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setLoading(true);
    try {
      await sendOTP(cleanPhone);
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => {
    const isInvalid = invalidFields.includes(field);
    return {
      width: "100%",
      padding: "10px 12px",
      border: isInvalid ? "2px solid #dc2626" : `1.5px solid ${focusedField === field ? BRAND : "#d1d5db"}`,
      borderRadius: 6,
      fontSize: 14,
      color: "#111827",
      outline: "none",
      background: "#fff",
      transition: "border-color 0.2s",
      boxShadow: focusedField === field ? `0 0 0 3px ${BRAND}22` : "none",
      fontFamily: "inherit",
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      zIndex: 99999, fontFamily: "'Metropolis', 'Segoe UI', system-ui, -apple-system, sans-serif", padding: 16,
    }}>
      <div className="otp-card">
        {/* Close button */}
        {onClose && (
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14, border: "none", background: "none",
            cursor: "pointer", color: "#9ca3af", fontSize: 20, lineHeight: 1, zIndex: 10,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "50%", transition: "background 0.2s",
          }}>✕</button>
        )}

        {/* ── STEP 1: Form ── */}
        {step === "form" && (
          <div className="otp-flex-container">
            <VehicleSidebarPanel carData={carData} step="form" />

            {/* Right Panel - Form */}
            <div className="otp-form-panel">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                Contact Information
              </h3>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>
                All fields marked with <span style={{ color: "#dc2626" }}>*</span> are required.
              </p>

              <div className="otp-input-grid">
                {/* First Name */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    First Name <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    className={invalidFields.includes("firstName") ? "field-error" : ""}
                    style={inputStyle("firstName")}
                    type="text" placeholder="" value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); if (invalidFields.includes("firstName")) setInvalidFields(invalidFields.filter(f => f !== "firstName")); }}
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Last Name
                  </label>
                  <input
                    className={invalidFields.includes("lastName") ? "field-error" : ""}
                    style={inputStyle("lastName")}
                    type="text" placeholder="" value={lastName}
                    onChange={(e) => { setLastName(e.target.value); if (invalidFields.includes("lastName")) setInvalidFields(invalidFields.filter(f => f !== "lastName")); }}
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                {/* Preferred Contact */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Preferred Contact
                  </label>
                  <select
                    className={invalidFields.includes("preferredContact") ? "field-error" : ""}
                    style={{ ...inputStyle("preferredContact"), cursor: "pointer", appearance: "auto" }}
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value)}
                    onFocus={() => setFocusedField("preferredContact")}
                    onBlur={() => setFocusedField(null)}
                  >
                    <option>Text</option>
                    <option>Call</option>
                    <option>Email</option>
                    <option>WhatsApp</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Phone <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    className={invalidFields.includes("phone") ? "field-error" : ""}
                    style={inputStyle("phone")}
                    type="tel" placeholder="" value={phone}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 15);
                      setPhone(d);
                      if (invalidFields.includes("phone")) setInvalidFields(invalidFields.filter(f => f !== "phone"));
                    }}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    className={invalidFields.includes("email") ? "field-error" : ""}
                    style={inputStyle("email")}
                    type="email" placeholder="" value={email}
                    onChange={(e) => { setEmail(e.target.value); if (invalidFields.includes("email")) setInvalidFields(invalidFields.filter(f => f !== "email")); }}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                {/* Comments */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Comments
                  </label>
                  <input
                    style={inputStyle("comments")}
                    type="text" placeholder="Any additional info..." value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    onFocus={() => setFocusedField("comments")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  marginTop: 16, padding: "10px 14px", background: "#fef2f2",
                  border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                style={{
                  marginTop: 24, width: "100%", padding: "13px 0",
                  background: loading ? "#94a3b8" : BRAND,
                  color: "#fff", border: "none", borderRadius: 6,
                  fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 10, transition: "background 0.2s",
                }}
              >
                {loading ? "Please wait" : (
                  <>
                    Unlock Instant Price
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                    </svg>
                  </>
                )}
              </button>

              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
                By requesting Instant Price, you agree that AM FORD Ashtabula and its affiliates, and sales professionals may call/text you about your inquiry, which may involve use of automated means and prerecorded/artificial voices. Message/data rates may apply. You also agree to our
                <a href="https://www.amfordashtabula.com/terms-of-use/" target="_blank" rel="noopener noreferrer" style={{ color: BRAND, fontWeight: 600, textDecoration: "underline" }}>
                  terms of use.
                </a>
              </p>

              <div className="otp-powered-by mobile-only" style={{ textAlign: "center" }}>
                <div style={{ color: "#9ca3af", fontSize: 11 }}>Powered by</div>
                <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 600, fontStyle: "italic" }}>AM Ford</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === "otp" && (
          <div className="otp-flex-container">
            <VehicleSidebarPanel carData={carData} step="otp" />
            <div className="otp-form-panel otp-form-panel--narrow-flow" style={{ paddingTop: 48, paddingBottom: 48, textAlign: "center" }}>
              <button
                type="button"
                onClick={() => { setStep("form"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                style={{
                  position: "absolute", top: 16, left: 16, border: "none", background: "none",
                  cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center",
                  gap: 4, fontSize: 13,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                Back
              </button>

              <div style={{
                width: 64, height: 64, borderRadius: "50%", background: BRAND_LIGHT,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8, fontStyle: "italic" }}>
                Instant Unlock Code Sent!
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 36, lineHeight: 1.6, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                Check your {preferredContact === "Email" ? "email" : "phone"} for the 6-digit code sent to{" "}
                <strong style={{ color: "#111827" }}>{cleanPhone}</strong>.
                {devMode && <span style={{ display: "block", marginTop: 6, background: "#fef3c7", color: "#92400e", fontSize: 12, padding: "4px 8px", borderRadius: 4, fontWeight: 600 }}>DEV MODE: Check your terminal for the OTP</span>}
              </p>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 12, textAlign: "center" }}>
                Confirmation Code <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    autoFocus={i === 0}
                    style={{
                      width: 52, height: 58, textAlign: "center", fontSize: 24, fontWeight: 700,
                      border: `2px solid ${focusedField === `otp${i}` ? BRAND : "#d1d5db"}`,
                      borderRadius: 8, outline: "none", color: "#111827", background: "#fff",
                      boxShadow: focusedField === `otp${i}` ? `0 0 0 3px ${BRAND}22` : "none",
                      transition: "all 0.15s",
                    }}
                    onFocus={() => setFocusedField(`otp${i}`)}
                    onBlur={() => setFocusedField(null)}
                  />
                ))}
              </div>

              {error && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", fontSize: 13, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyOTP} disabled={loading}
                style={{
                  width: "100%", maxWidth: 420, marginLeft: "auto", marginRight: "auto", display: "block",
                  padding: "13px 0",
                  background: loading ? "#94a3b8" : BRAND,
                  color: "#fff", border: "none", borderRadius: 6,
                  fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Verifying…" : "Confirm →"}
              </button>

              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, fontSize: 13 }}>
                <button
                  type="button"
                  onClick={handleResend} disabled={resendTimer > 0 || loading}
                  style={{ background: "none", border: "none", color: resendTimer > 0 ? "#9ca3af" : BRAND, cursor: resendTimer > 0 ? "default" : "pointer", fontSize: 13, fontWeight: 500 }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </button>
              </div>

              <div className="otp-powered-by mobile-only" style={{ textAlign: "center", marginTop: 32 }}>
                <div style={{ color: "#9ca3af", fontSize: 11 }}>Powered by</div>
                <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 600, fontStyle: "italic" }}>AM Ford</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Success ── */}
        {step === "success" && (
          <div className="otp-flex-container">
            <VehicleSidebarPanel carData={carData} step="success" />
            <div className="otp-form-panel otp-form-panel--narrow-flow" style={{ paddingTop: 44, paddingBottom: 44, textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", background: "#f0fdf4",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
                border: "3px solid #bbf7d0",
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8, fontStyle: "italic" }}>
                Successfully Verified!
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                Welcome, <strong style={{ color: "#111827" }}>{`${firstName} ${lastName}`.trim()}</strong>. Your identity has been verified successfully.
              </p>
              <div style={{
                background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10,
                padding: "20px 24px", textAlign: "left", display: "flex", flexDirection: "column", gap: 12,
                maxWidth: 420, marginLeft: "auto", marginRight: "auto", width: "100%",
              }}>
                {[
                  { icon: "👤", label: "Name", value: `${firstName} ${lastName}`.trim() },
                  { icon: "📧", label: "Email", value: email },
                  { icon: "📱", label: "Phone", value: cleanPhone },
                  { icon: "💬", label: "Preferred", value: preferredContact },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 14, color: "#111827", fontWeight: 500 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 12 }}>✅ Details saved to session storage</p>
              {onClose && (
                <button type="button" onClick={onClose} style={{
                  marginTop: 24, width: "100%", maxWidth: 420, marginLeft: "auto", marginRight: "auto", display: "block",
                  padding: "13px 0",
                  background: BRAND, color: "#fff", border: "none", borderRadius: 6,
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}>
                  Done
                </button>
              )}
              <div className="otp-powered-by mobile-only" style={{ textAlign: "center", marginTop: 28 }}>
                <div style={{ color: "#9ca3af", fontSize: 11 }}>Powered by</div>
                <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 600, fontStyle: "italic" }}>AM Ford</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}