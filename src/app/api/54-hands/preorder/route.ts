import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const projectId: string = body?.projectId ?? "";
  const name: string = body?.name?.trim() ?? "";
  const email: string = body?.email?.trim() ?? "";
  const phone: string = body?.phone?.trim() ?? "";
  const addressLine1: string = body?.addressLine1?.trim() ?? "";
  const addressLine2: string = body?.addressLine2?.trim() ?? "";
  const city: string = body?.city?.trim() ?? "";
  const state: string = body?.state?.trim() ?? "";
  const postalCode: string = body?.postalCode?.trim() ?? "";
  const country: string = body?.country?.trim() || "India";
  const quantity: number = Number(body?.quantity) || 0;
  const unitPricePaise: number = Number(body?.unitPricePaise) || 0;
  const razorpayOrderId: string = body?.razorpayOrderId ?? "";
  const razorpayPaymentId: string = body?.razorpayPaymentId ?? "";
  const razorpaySignature: string = body?.razorpaySignature ?? "";

  if (
    !projectId || !name || !email || !phone || !addressLine1 || !city || !state || !postalCode ||
    quantity < 1 || unitPricePaise < 1 || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature
  ) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  // Re-verify the payment signature server-side rather than trusting the client's
  // report that /api/verify-payment already succeeded — this is the endpoint that
  // actually writes a paid order to the database, so it re-checks independently.
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { error: insertError } = await supabase.from("deck_preorders").insert({
    project_id: projectId,
    name,
    email,
    phone,
    address_line1: addressLine1,
    address_line2: addressLine2 || null,
    city,
    state,
    postal_code: postalCode,
    country,
    quantity,
    unit_price_paise: unitPricePaise,
    total_amount_paise: unitPricePaise * quantity,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "This payment has already been recorded." }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
