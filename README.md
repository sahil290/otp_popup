# OTP Verification Popup

A Next.js embeddable OTP verification popup. Collect Name, Email, and Phone — verify the phone number via SMS OTP — and receive a callback with the verified user data.

---

## Features

- **3-step flow**: Form → OTP entry → Success
- **SMS via Twilio** (with dev-mode fallback that logs OTP to console)
- **Embeddable on any website** via a single `<script>` tag (no React/npm needed on the host site)
- **iframe + postMessage** architecture for cross-origin isolation
- **Rate limiting** & **OTP expiry** (5 min, max 5 attempts)
- **CORS headers** pre-configured

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Twilio credentials:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
# Optional (recommended for better deliverability):
# TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Optional (helps local-number input, e.g. 91 for India):
# DEFAULT_COUNTRY_CODE=91

# Supabase (verified leads — optional)
# SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# SUPABASE_LEADS_TABLE=otp_leads
```

Run the SQL in `supabase/migrations/001_otp_leads.sql` in the Supabase SQL editor to create the table, then `002_otp_leads_vehicle_snapshot.sql` for the optional JSON column (`vehicle_snapshot`).

WordPress GTM iframe URLs should pass vehicle data like `?vin=&stock=&price=&vehicle=&page_url=` (see `public/gtm-wordpress-snippet.example.txt`).

> **No Twilio yet?** Leave these blank — OTPs will be logged to your terminal console instead (dev mode).
> **Twilio trial note:** Trial accounts can only send to phone numbers you verified in Twilio Console.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo page.

---

## Embedding on External Websites

### Method 1 — Script tag (recommended)

Paste this before `</body>` on any HTML page:

```html
<script
  src="https://YOUR-DOMAIN.com/embed.js"
  data-trigger="#your-button-id"
  data-on-success="handleVerified"
></script>

<button id="your-button-id">Verify Phone</button>

<script>
  function handleVerified(user) {
    console.log('Verified user:', user);
    // user = { name: "...", email: "...", phone: "+91..." }
  }
</script>
```

Replace `YOUR-DOMAIN.com` with your deployed URL (e.g. `https://otp-app.vercel.app`).

### Method 2 — Programmatic API

```html
<script src="https://YOUR-DOMAIN.com/embed.js"></script>
<script>
  // Open the popup manually
  window.OTPPopup.open();

  // Listen via DOM event
  document.addEventListener('otp:success', (e) => {
    console.log(e.detail); // { name, email, phone }
  });
</script>
```

### Method 3 — iframe directly

```html
<iframe
  src="https://YOUR-DOMAIN.com/popup"
  style="position:fixed;inset:0;width:100%;height:100%;border:none;z-index:9999"
></iframe>

<script>
  // Listen for postMessage from the iframe
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'OTP_SUCCESS') {
      console.log('Verified:', e.data.payload);
    }
  });
</script>
```

---

## Project Structure

```
otp-popup/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── send-otp/route.ts   ← Sends OTP via Twilio
│   │   │   └── verify-otp/route.ts ← Verifies OTP
│   │   ├── popup/page.tsx          ← Standalone iframe page
│   │   ├── page.tsx                ← Demo page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── OTPPopup.tsx            ← Core popup UI
│   │   ├── OTPPopupDemo.tsx        ← Demo wrapper
│   │   └── OTPPopupStandalone.tsx  ← iframe wrapper
│   └── lib/
│       └── otpStore.ts             ← In-memory OTP store
├── public/
│   ├── embed.js                    ← Script for external sites
│   └── external-example.html      ← Example external site
├── next.config.js                  ← CORS headers configured
└── .env.local.example
```

---

## API Reference

### POST `/api/send-otp`

```json
Request:  { "phone": "+919876543210" }
Response: { "success": true, "message": "OTP sent successfully" }
```

### POST `/api/verify-otp`

```json
Request:  { "phone": "+919876543210", "otp": "123456", "name": "John", "email": "john@example.com" }
Response: { "success": true, "message": "Phone verified!", "user": { "name", "email", "phone" } }
```

Both endpoints include `Access-Control-Allow-Origin: *` headers so they can be called from any domain.

---

## Saving Verified Users

In `src/app/api/verify-otp/route.ts`, find the comment:

```ts
// TODO: Save user to your database here
// Example: await db.users.create({ name, email, phone, verifiedAt: new Date() })
console.log("Verified user:", { name, email, phone });
```

Replace this with your own database logic (Prisma, Supabase, MongoDB, etc.).

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Docker / any Node server

```bash
npm run build
npm start
```

---

## Production Notes

- **OTP Store**: The default in-memory store resets on server restart. For production, replace `src/lib/otpStore.ts` with a Redis-backed implementation.
- **Rate limiting**: Add IP-based rate limiting (e.g. `upstash/ratelimit`) to `/api/send-otp` to prevent abuse.
- **CORS**: To restrict which domains can embed the popup, update `ALLOWED_ORIGINS` in `.env.local` and tighten the headers in `next.config.js`.
