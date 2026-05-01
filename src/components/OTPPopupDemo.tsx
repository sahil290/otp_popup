"use client";
// src/components/OTPPopupDemo.tsx
// Demo page on your Next.js app itself

import { useState } from "react";
import OTPPopup from "./OTPPopup";

export default function OTPPopupDemo() {
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState<{ name: string; email: string; phone: string } | null>(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      gap: 24,
      padding: 24,
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e1b4b", letterSpacing: "-0.03em" }}>
        OTP Popup — Demo Page
      </h1>
      <p style={{ color: "#6b7280", maxWidth: 480, textAlign: "center", lineHeight: 1.7 }}>
        This is your Next.js app. Click below to test the popup locally, or embed it on any
        external website using the <code style={{ background: "#e0e7ff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>embed.js</code> script.
      </p>

      {verified && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          padding: "16px 24px",
          color: "#166534",
          fontSize: 14,
        }}>
          ✅ <strong>{verified.name}</strong> verified ({verified.phone})
        </div>
      )}

      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "14px 32px",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "-0.01em",
          boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
        }}
      >
        Open Verification Popup
      </button>

      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "24px",
        maxWidth: 600,
        width: "100%",
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
          Embed on any website — copy this snippet:
        </h3>
        <pre style={{
          background: "#1e1b4b",
          color: "#a5f3fc",
          borderRadius: 10,
          padding: "16px",
          fontSize: 12,
          overflowX: "auto",
          lineHeight: 1.7,
          margin: 0,
        }}>
{`<!-- Paste before </body> on any website -->
<script
  src="https://YOUR-DOMAIN.com/embed.js"
  data-trigger="#verify-btn"
  data-on-success="myCallbackFn"
></script>

<button id="verify-btn">Verify Phone Number</button>

<script>
  function myCallbackFn(user) {
    console.log('Verified:', user);
    // user = { name, email, phone }
  }
</script>`}
        </pre>
      </div>

      {open && (
        <OTPPopup
          onClose={() => setOpen(false)}
          onSuccess={(data) => {
            setVerified(data);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
