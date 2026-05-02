import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { verifyOTP } from "@/lib/otpStore";
import { normalizePhone } from "@/lib/phone";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

interface UserData {
  firstName: string;
  lastName: string;
  phone: string;
  preferredContact: string;
  email: string;
  comments: string;
  verifiedAt: string;
  name?: string;
}

interface CarData {
  title: string;
  price: string;
  vin: string;
  stock: string;
  source?: string;
  pageUrl?: string;
  vehicleSnapshot?: Record<string, unknown> | null;
}

async function saveLeadToSupabase(userData: UserData, carData?: CarData) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(
      "[SUPABASE] Lead not saved: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY on the server.",
    );
    return;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const table = process.env.SUPABASE_LEADS_TABLE || "otp_leads";
  const row = {
    first_name: userData.firstName ?? "",
    last_name: userData.lastName ?? "",
    phone: userData.phone,
    email: userData.email || null,
    preferred_contact: userData.preferredContact || null,
    comments: userData.comments || null,
    verified_at: userData.verifiedAt || null,
    vehicle_title: carData?.title || null,
    price: carData?.price || null,
    vin: carData?.vin || null,
    stock: carData?.stock || null,
    page_url: carData?.pageUrl || null,
    embed_source: carData?.source || null,
    vehicle_snapshot: carData?.vehicleSnapshot ?? null,
  };

  const { error, data } = await supabase.from(table).insert(row).select("id");
  if (error) {
    console.error("[SUPABASE] insert failed:", error.message, error.code, error.details, error.hint);
    return;
  }
  const inserted = Array.isArray(data) ? data[0] : data;
  console.log("[SUPABASE] Lead inserted:", table, inserted?.id ?? "(no id)");
}

async function sendAdminEmail(userData: UserData, carData?: CarData) {
  // Only try to send if configuration exists
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email configuration missing. Skipping email notification.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log(
    `[EMAIL] Attempting to send from ${process.env.EMAIL_USER} to ${process.env.EMAIL_TO} via ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`,
  );

  const adfDate = new Date().toISOString();
  const formTitle = "OTP Verification Popup";
  const dealerName = "Am Ford";

  // Attempt to parse vehicle title (e.g. "2024 Ford Mustang")
  let year = "";
  let make = "";
  let model = "";
  if (carData?.title) {
    const parts = carData.title.split(" ");
    if (parts.length >= 1 && /^\d{4}$/.test(parts[0])) year = parts[0];
    if (parts.length >= 2) make = parts[1];
    model = parts.slice(2).join(" ") || carData.title;
  }

  const mailOptions = {
    from: `"Lead Generator" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `ADF Lead: ${userData.firstName} ${userData.lastName}`,
    text: `<?xml version="1.0"?>
<?adf version="1.0"?>
<adf>
    <prospect>
        <requestdate><![CDATA[${adfDate}]]></requestdate>
        <vehicle status="Used" interest="buy">
            <year><![CDATA[${year}]]></year>
            <make><![CDATA[${make}]]></make>
            <model><![CDATA[${model}]]></model>
            <stock><![CDATA[${carData?.stock || ""}]]></stock>
            <trim><![CDATA[]]></trim>
            <vin><![CDATA[${carData?.vin || ""}]]></vin>
            <comments><![CDATA[New Submission from ${formTitle}.

Message:  ${userData.comments || "No comments"}

Page URL: ${carData?.pageUrl || ""}

Embed source param: ${carData?.source || ""}
]]></comments>
        </vehicle>
        <customer>
            <contact>
                <name part="first"><![CDATA[${userData.firstName}]]></name>
                <name part="last"><![CDATA[${userData.lastName}]]></name>
                <phone><![CDATA[${userData.phone}]]></phone>
                <email><![CDATA[${userData.email}]]></email>
                <address>
                    <postalcode><![CDATA[]]></postalcode>
                </address>
            </contact>
            <comments />
        </customer>
        <vendor>
            <id source="">${dealerName}</id>
            <vendorname><![CDATA[${dealerName}]]></vendorname>
            <url><![CDATA[http://www.amfordashtabula.com]]></url>
            <contact>
                <phone type="voice" time="day"><![CDATA[855-357-4677]]></phone>
                <email><![CDATA[support@dealerinspire.com]]></email>
                <address>
                    <street line="1"><![CDATA[1059 OH-46]]></street>
                    <city><![CDATA[Jefferson]]></city>
                    <regioncode><![CDATA[OH]]></regioncode>
                    <postalcode><![CDATA[44047]]></postalcode>
                    <country><![CDATA[US]]></country>
                </address>
            </contact>
        </vendor>
        <provider>
            <id source="">OTP_PORTAL</id>
            <name><![CDATA[Dealer Inspire/${formTitle}]]></name>
            <url><![CDATA[http://www.dealerinspire.com]]></url>
            <email><![CDATA[support@dealerinspire.com]]></email>
            <phone><![CDATA[855-357-4677]]></phone>
            <contact primarycontact="1">
                <name part="full"><![CDATA[Dealer Inspire Support]]></name>
                <email><![CDATA[support@dealerinspire.com]]></email>
                <phone type="voice" time="day"><![CDATA[855-357-4677]]></phone>
            </contact>
        </provider>
    </prospect>
</adf>`,
  };

  await transporter.sendMail(mailOptions);
  console.log("[EMAIL] Mail command sent to transporter.");
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, car, otp } = body;

    // Fallback for old structure if needed, but primarily use new one
    const userData = user || body;
    const carData = car;
    const { phone, firstName, lastName, email, preferredContact, comments } =
      userData;
    const { otp: oldOtp } = body;
    const finalOtp = otp || oldOtp;

    if (!phone || !finalOtp)
      return NextResponse.json(
        { error: "Phone and OTP are required" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
      );

    const name = `${firstName} ${lastName}`.trim();

    const { digits: normalized, e164: fullPhone } = normalizePhone(phone);
    
    console.log(`[OTP STORE] Verifying OTP for phone key: "${normalized}"`);



    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      // Dev mode or local test mode - check otpStore
      const result = verifyOTP(normalized, finalOtp);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Invalid or expired OTP." },
          { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
        );
      }

      console.log(`[LOCAL VERIFY] Verified ${fullPhone}`);

      // Send email notification to admin
      try {
        const adminUserData = { ...userData, phone: fullPhone };
        await saveLeadToSupabase(adminUserData, carData);
        await sendAdminEmail(adminUserData, carData);
      } catch (emailError) {
        console.error("Email sending failed (Local Verify):", emailError);
      }

      return NextResponse.json(
        {
          success: true,
          message: "Local verification successful",
          user: { name, email, phone: fullPhone },
        },
        { status: 200, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    // Verify OTP locally (using the code sent via Twilio)
    const result = verifyOTP(normalized, finalOtp);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired OTP." },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    console.log("Verified user:", { name, email, phone: fullPhone });

    // Send email notification to admin
    try {
      console.log("Attempting to save lead and send admin email...");
      const adminUserData = { ...userData, phone: fullPhone };
      await saveLeadToSupabase(adminUserData, carData);
      await sendAdminEmail(adminUserData, carData);
      console.log("Admin email processed.");
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // We don't block the response even if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Phone verified successfully!",
        user: { name, email, phone: fullPhone },
      },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  } catch (e: any) {
    if (e?.message?.includes("Invalid phone number")) {
      return NextResponse.json(
        { error: e.message },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }
    console.error("Verify OTP error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }
}
