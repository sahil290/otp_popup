import { NextRequest, NextResponse } from "next/server";
import { generateOTP, saveOTP } from "@/lib/otpStore";
import { normalizePhone } from "@/lib/phone";
import twilio from "twilio";

const DELIVERY_FAILURE_STATES = new Set(["failed", "undelivered", "canceled"]);
const STATUS_CHECK_WAIT_MS = Number(process.env.TWILIO_STATUS_CHECK_WAIT_MS || 2500);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || !phone.trim()) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });

    const { digits: normalized, e164: fullPhone } = normalizePhone(phone);



    const otp = generateOTP();
    console.log(`[OTP STORE] Saving OTP for phone key: "${normalized}" (Full: ${fullPhone})`);
    saveOTP(normalized, otp);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
      console.log(`[DEV MODE] OTP for ${fullPhone}: ${otp}`);
      return NextResponse.json(
        { success: true, dev: true, message: "OTP logged to server console (Twilio config missing)" },
        { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const client = twilio(accountSid, authToken);

    try {
      console.log(`[TWILIO] Attempting to send to: ${fullPhone} from: ${fromNumber}`);
      const message = await client.messages.create({
        body: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
        to: fullPhone,
        ...(messagingServiceSid
          ? { messagingServiceSid }
          : { from: fromNumber as string }),
      });

      // Twilio "create" success means accepted/queued, not guaranteed delivery.
      // Fetch an updated status shortly after enqueueing so API can surface failures.
      await sleep(STATUS_CHECK_WAIT_MS);
      const latest = await client.messages(message.sid).fetch();
      console.log(`[TWILIO] Queued: ${message.sid}, latest status: ${latest.status}`);

      if (DELIVERY_FAILURE_STATES.has(latest.status)) {
        return NextResponse.json(
          {
            error: latest.errorMessage || "OTP was not delivered by carrier.",
            sid: latest.sid,
            status: latest.status,
            code: latest.errorCode || undefined,
            to: fullPhone,
          },
          { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "OTP accepted by Twilio",
          sid: message.sid,
          status: latest.status,
        },
        { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    } catch (twilioError: any) {
      console.error("Twilio SDK Error:", twilioError);
      return NextResponse.json(
        { 
          error: twilioError.message || "Failed to send OTP via Twilio.",
          code: twilioError.code,
          moreInfo: twilioError.moreInfo,
          status: twilioError.status
        },
        { status: twilioError.status || 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
  } catch (e: any) {
    if (e?.message?.includes("Invalid phone number")) {
      return NextResponse.json(
        { error: e.message },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
    console.error("Send OTP error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}