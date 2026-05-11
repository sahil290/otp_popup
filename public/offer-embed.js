/**
 * Offer Popup ($500 OFF) — WordPress Embed Script
 * ─────────────────────────────────────────────
 * Shows the offer popup on the home page after 10 seconds.
 */
(function () {
  const script = document.currentScript;
  const origin = new URL(script.src).origin;

  // ── Configuration ────────────────────────────────────────────────────────
  const delaySeconds = 10;
  const showOnlyOnHomePage = true; // Set to false to show on all pages

  // ── Create the iframe overlay ─────────────────────────────────────────────
  let iframe = null;
  let overlay = null;

  function createOfferPopup() {
    if (iframe) return; 

    overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      display: "none",
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      webkitBackdropFilter: "blur(4px)",
    });

    iframe = document.createElement("iframe");
    iframe.src = `${origin}/offer?apiBase=${encodeURIComponent(origin)}&source=wordpress-home-timed`;
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

    // Listen for messages from the offer iframe
    window.addEventListener("message", function (e) {
      if (e.origin !== origin) return;

      if (e.data?.type === "OFFER_CLOSE" || e.data === "close-offer") {
        hideOfferPopup();
      }
    });
  }

  function showOfferPopup() {
    // Check if user has already dismissed it in this session
    if (sessionStorage.getItem("offer_dismissed")) return;

    createOfferPopup();
    overlay.style.display = "block";
    iframe.contentWindow.postMessage({ type: "OFFER_OPEN" }, origin);
    document.body.style.overflow = "hidden";
  }

  function hideOfferPopup() {
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
    sessionStorage.setItem("offer_dismissed", "true");
  }

  // ── Set Timer ────────────────────────────────────────────────────────────
  function initTimedOffer() {
    // Check if it's the home page immediately
    if (showOnlyOnHomePage) {
      const path = window.location.pathname;
      const isHome = path === "/" || path === "/index.php" || path === "" || path.endsWith("/home/");
      if (!isHome) return;
    }

    // Only start the timer if on the home page
    setTimeout(showOfferPopup, delaySeconds * 1000);
  }

  // Public API
  window.OfferPopup = { open: showOfferPopup, close: hideOfferPopup };

  // Wait for load
  if (document.readyState === "complete") {
    initTimedOffer();
  } else {
    window.addEventListener("load", initTimedOffer);
  }
})();
