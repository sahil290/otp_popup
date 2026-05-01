// src/lib/otpStore.ts
// In-memory OTP store (for production, use Redis or a DB)

interface OTPRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// Persist store across HMR reloads in development
const globalForOtp = global as unknown as { otpStore: Map<string, OTPRecord> };
const store = globalForOtp.otpStore || new Map<string, OTPRecord>();
if (process.env.NODE_ENV !== "production") globalForOtp.otpStore = store;

const EXPIRY_MS = (Number(process.env.OTP_EXPIRY_SECONDS) || 300) * 1000;

const MAX_ATTEMPTS = 5;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveOTP(phone: string, otp: string): void {
  store.set(phone, {
    otp,
    expiresAt: Date.now() + EXPIRY_MS,
    attempts: 0,
  });
}

export function verifyOTP(
  phone: string,
  otp: string
): { success: boolean; error?: string } {
  const record = store.get(phone);

  if (!record) {
    return { success: false, error: "OTP not found. Please request a new one." };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(phone);
    return { success: false, error: "OTP has expired. Please request a new one." };
  }

  record.attempts += 1;

  if (record.attempts > MAX_ATTEMPTS) {
    store.delete(phone);
    return {
      success: false,
      error: "Too many attempts. Please request a new OTP.",
    };
  }

  if (record.otp !== otp) {
    return { success: false, error: "Invalid OTP. Please try again." };
  }

  store.delete(phone);
  return { success: true };
}
