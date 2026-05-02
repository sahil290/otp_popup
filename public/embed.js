/**
 * OTP Verification Popup — Embed Script
 * ──────────────────────────────────────
 * Usage:
 *   <script
 *     src="https://YOUR-DOMAIN.com/embed.js"
 *     data-trigger="#verify-btn"
 *     data-on-success="myCallbackFn"
 *   ></script>
 *
 * Attributes:
 *   data-trigger      CSS selector for the button that opens the popup
 *   data-on-success   Name of a global function to call on successful verification
 */
(function () {
  const script = document.currentScript;
  const origin = new URL(script.src).origin;

  const triggerSelector = script.getAttribute("data-trigger") || null;
  const onSuccessFnName = script.getAttribute("data-on-success") || null;

  // ── Create the iframe overlay ─────────────────────────────────────────────
  let iframe = null;
  let overlay = null;

  function createPopup() {
    if (iframe) return; // already created

    overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      display: "none",
    });

    iframe = document.createElement("iframe");
    iframe.src = `${origin}/popup?apiBase=${encodeURIComponent(origin)}`;
    Object.assign(iframe.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      border: "none",
      background: "transparent",
    });
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("frameborder", "0");

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    // Listen for messages from the popup iframe
    window.addEventListener("message", function (e) {
      if (e.origin !== origin) return;

      if (e.data?.type === "OTP_SUCCESS") {
        hidePopup();
        const p = e.data.payload;
        const user =
          p && typeof p === "object" && "user" in p ? p.user : p;
        if (onSuccessFnName && typeof window[onSuccessFnName] === "function") {
          window[onSuccessFnName](user);
        }
        document.dispatchEvent(
          new CustomEvent("otp:success", { detail: p })
        );
      }

      if (e.data?.type === "OTP_CLOSE" || e.data === "close-popup") {
        hidePopup();
        document.dispatchEvent(new CustomEvent("otp:close"));
      }
    });
  }

  function showPopup() {
    createPopup();
    overlay.style.display = "block";
    iframe.contentWindow.postMessage({ type: "OTP_OPEN" }, origin);
    document.body.style.overflow = "hidden";
  }

  function hidePopup() {
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  // ── Wire up trigger button ────────────────────────────────────────────────
  function wireUpTrigger() {
    if (!triggerSelector) return;
    const el = document.querySelector(triggerSelector);
    if (el) {
      el.addEventListener("click", showPopup);
    }
  }

  // ── Public API on window.OTPPopup ─────────────────────────────────────────
  window.OTPPopup = { open: showPopup, close: hidePopup };

  // Wire up after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireUpTrigger);
  } else {
    wireUpTrigger();
  }
})();
