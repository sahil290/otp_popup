"use client";
import { useEffect, useState } from "react";
import OfferPopup from "./OfferPopup";

export default function OfferPopupStandalone() {
  const [open, setOpen] = useState(true);
  const [apiBase, setApiBase] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const base = params.get("apiBase") || window.location.origin;
    setApiBase(base);

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "OFFER_OPEN") setOpen(true);
      if (e.data?.type === "OFFER_CLOSE") setOpen(false);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleClose = () => {
    window.parent.postMessage({ type: "OFFER_CLOSE" }, "*");
    window.parent.postMessage("close-offer", "*");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <OfferPopup
      apiBase={apiBase}
      onClose={handleClose}
    />
  );
}
