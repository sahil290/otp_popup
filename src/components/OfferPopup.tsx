"use client";
import { useState } from "react";

interface OfferPopupProps {
  onClose?: () => void;
  apiBase?: string;
}

const BRAND = "#05214F";
const BRAND_SECONDARY = "#0A2E6B";

export default function OfferPopup({ onClose, apiBase = "" }: OfferPopupProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get car data from URL/context similar to old popup
      const params = new URLSearchParams(window.location.search);
      const carData = {
        title: params.get("vehicle") || params.get("title") || "General Offer Inquiry",
        price: params.get("price") || "",
        vin: params.get("vin") || "",
        stock: params.get("stock") || "",
        source: params.get("source") || "offer-popup",
        pageUrl: params.get("pageUrl") || window.location.href,
      };

      const payload = {
        user: {
          firstName,
          lastName,
          phone,
          email,
          preferredContact: "Email", // Default for offer popup
          comments: "Submitted via $500 OFF Offer Popup",
          verifiedAt: new Date().toISOString(),
        },
        car: carData,
        otp: "BYPASS_OFFER" // Bypassing OTP for direct offer submission
      };

      const res = await fetch(`${apiBase}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", zIndex: 9999, padding: 16,
        fontFamily: "'Metropolis', sans-serif"
      }}>
        <div style={{
          background: "white", padding: 40, borderRadius: 16, textAlign: "center",
          maxWidth: 400, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
        }}>
          <div style={{ 
            width: 64, height: 64, background: "#ecfdf5", borderRadius: "50%", 
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" 
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: BRAND, marginBottom: 12 }}>Thank You!</h2>
          <p style={{ color: "#6b7280", lineHeight: 1.6 }}>Your offer has been submitted successfully. A representative will contact you shortly.</p>
          <button 
            onClick={onClose}
            style={{
              marginTop: 24, width: "100%", padding: "12px", background: BRAND,
              color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "transparent", zIndex: 9999, padding: 16,
      fontFamily: "'Metropolis', sans-serif"
    }}>
      <div style={{
        background: "white",
        width: "100%",
        maxWidth: 500,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
        position: "relative"
      }}>
        {/* Top Header Section */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_SECONDARY} 100%)`,
          padding: "24px 20px",
          textAlign: "center",
          position: "relative",
          color: "white"
        }}>
          {/* Geometric Pattern Overlay */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.1, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }}></div>

          <button 
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)",
              border: "none", borderRadius: "50%", padding: 6, cursor: "pointer", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
            <div style={{
              background: "#fff",
              padding: "8px 16px",
              borderRadius: 8,
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
            }}>
              <img 
                src="https://di-uploads-development.dealerinspire.com/amford/uploads/2025/08/Am-ford.png" 
                alt="AM Ford" 
                style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }}
              />
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ 
              fontSize: 54, fontWeight: 900, margin: 0, lineHeight: 1, 
              letterSpacing: "-0.04em", fontStyle: "italic", textShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}>
              $500 <span style={{ fontSize: 28 }}>OFF</span>
            </h1>
            <p style={{ 
              fontSize: 16, fontWeight: 700, margin: "6px 0", letterSpacing: "0.05em",
              textTransform: "uppercase", opacity: 0.9 
            }}>
              Your New Vehicle Purchase
            </p>
            
            <div style={{ 
              height: 2, width: 60, background: "white", margin: "14px auto", opacity: 0.3 
            }}></div>
            
            <p style={{ fontSize: 9, opacity: 0.6, maxWidth: 380, margin: "0 auto", lineHeight: 1.3 }}>
              *$500 off the list price of any new vehicle purchase. Cannot be combined with other offers. Offer not redeemable on past purchases. See dealer for complete details. Must present at time of write-up.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 24px 32px" }}>
          <div className="offer-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
            gap: 12, 
            marginBottom: 12 
          }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>FIRST NAME</label>
              <input 
                required
                type="text" 
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px 16px", borderRadius: 10, border: "2px solid #e5e7eb",
                  fontSize: 14, outline: "none", transition: "border-color 0.2s"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>LAST NAME</label>
              <input 
                required
                type="text" 
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px 16px", borderRadius: 10, border: "2px solid #e5e7eb",
                  fontSize: 14, outline: "none"
                }}
              />
            </div>
          </div>

          <div className="offer-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
            gap: 12, 
            marginBottom: 18 
          }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>PHONE</label>
              <input 
                required
                type="tel" 
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px 16px", borderRadius: 10, border: "2px solid #e5e7eb",
                  fontSize: 14, outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>EMAIL</label>
              <input 
                required
                type="email" 
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px 16px", borderRadius: 10, border: "2px solid #e5e7eb",
                  fontSize: 14, outline: "none"
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: "10px 14px", background: "#fef2f2",
              border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13,
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px", background: BRAND, color: "white",
              border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.05em",
              textTransform: "uppercase", boxShadow: `0 8px 20px ${BRAND}44`,
              transition: "transform 0.2s, background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            {loading ? "Processing..." : "Submit Offer"}
          </button>

          <div style={{ 
            display: "flex", justifyContent: "space-between", marginTop: 18, 
            fontSize: 11, color: "#9ca3af", fontWeight: 600 
          }}>
            <a href="https://www.amfordashtabula.com/terms-of-use/" target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", textDecoration: "underline" }}>Terms & Conditions</a>
            <button type="button" onClick={onClose} style={{ 
              background: "none", border: "none", color: "#9ca3af", 
              textDecoration: "underline", cursor: "pointer", fontSize: 11, fontWeight: 600 
            }}>
              No, Thank You
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
