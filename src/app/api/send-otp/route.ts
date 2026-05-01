import { NextRequest, NextResponse } from "next/server";
import { generateOTP, saveOTP } from "@/lib/otpStore";
import twilio from "twilio";

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
    
    let normalized = phone.replace(/\D/g, "");
    
    // No more guessing. Just prepend "+" to the digits provided.
    // To send to India, the user MUST enter "91..."
    let fullPhone = "+" + normalized;



    const otp = generateOTP();
    console.log(`[OTP STORE] Saving OTP for phone key: "${normalized}" (Full: ${fullPhone})`);
    saveOTP(normalized, otp);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
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
        from: fromNumber,
        to: fullPhone
      });
      
      console.log(`[TWILIO] Success: ${message.sid}`);
      return NextResponse.json(
        { success: true, message: "OTP sent successfully via Twilio", sid: message.sid },
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
  } catch (e) {
    console.error("Send OTP error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}