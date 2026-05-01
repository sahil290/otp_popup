// src/app/popup/page.tsx
// This page is designed to be embedded as an iframe on any external website.
// It communicates back to the parent via postMessage.

import OTPPopupStandalone from "@/components/OTPPopupStandalone";

export default function PopupPage() {
  return <OTPPopupStandalone />;
}
