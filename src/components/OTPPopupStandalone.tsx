"use client";
// src/components/OTPPopupStandalone.tsx
// Used at /popup route — designed to be embedded as an iframe.
// Communicates with parent window via window.postMessage.

import { useEffect, useState } from "react";
import OTPPopup from "./OTPPopup";

export default function OTPPopupStandalone() {
  const [open, setOpen] = useState(true);
  const [apiBase, setApiBase] = useState("");

  useEffect(() => {
    // Allow parent to pass the API base if the iframe origin differs
    const params = new URLSearchParams(window.location.search);
    const base = params.get("apiBase") || window.location.origin;
    setApiBase(base);

    // Listen for open/close commands from parent
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "OTP_OPEN") setOpen(true);
      if (e.data?.type === "OTP_CLOSE") setOpen(false);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleSuccess = (data: unknown) => {
    console.log("OTPPopupStandalone: handleSuccess received", data);
    // Parent (WordPress overlay) must remove the iframe on these events — otherwise the iframe goes blank (React unmounts).
    window.parent.postMessage({ type: "OTP_SUCCESS", payload: data }, "*");
    window.parent.postMessage({ type: "OTP_CLOSE" }, "*");
    window.parent.postMessage("close-popup", "*");
    setOpen(false);
  };

  const handleClose = () => {
    window.parent.postMessage({ type: "OTP_CLOSE" }, "*");
    window.parent.postMessage("close-popup", "*");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <OTPPopup
      apiBase={apiBase}
      onSuccess={handleSuccess}
      onClose={handleClose}
    />
  );
}
