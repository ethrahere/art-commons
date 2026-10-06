import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { UNIT_PRICE_PAISE } from "@/app/54-hands/pre-order/pricing";

interface MagicAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  contact?: string;
}

interface MagicOrder {
  notes?: Record<string, string | number>;
  shipping_fee?: number;
  customer_details?: {
    name?: string;
    email?: string;
    contact?: string;
    shipping_address?: MagicAddress;
  };
}

// Called from the checkout handler after a successful payment. Verifies the
// signature, then pulls the address/contact/delivery fee (collected by Magic
// Checkout, or stored in the notes by our fallback form) from the Razorpay order
// itself — nothing about the order is taken from the client except the three
// Razorpay IDs.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const razorpayOrderId: string = body?.razorpayOrderId ?? "";
  const razorpayPaymentId: string = body?.razorpayPaymentId ?? "";
  const razorpaySignature: string = body?.razorpaySignature ?? "";

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const verified = validatePaymentVerification(
    { order_id: razorpayOrderId, payment_id: razorpayPaymentId },
    razorpaySignature,
    process.env.RAZORPAY_KEY_SECRET!
  );
  if (!verified) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const [order, payment] = await Promise.all([
    razorpay.orders.fetch(razorpayOrderId) as unknown as Promise<MagicOrder>,
    razorpay.payments.fetch(razorpayPaymentId),
  ]);

  const notes = order.notes ?? {};
  const customer = order.customer_details ?? {};
  // Magic Checkout puts the address in customer_details; our own fallback form
  // stores it in the order notes (set server-side in /preorder/order).
  const address: MagicAddress = customer.shipping_address?.line1
    ? customer.shipping_address
    : {
        name: notes.name ? String(notes.name) : undefined,
        line1: notes.line1 ? String(notes.line1) : undefined,
        line2: notes.line2 ? String(notes.line2) : undefined,
        city: notes.city ? String(notes.city) : undefined,
        state: notes.state ? String(notes.state) : undefined,
        zipcode: notes.pincode ? String(notes.pincode) : undefined,
        country: "IN",
        contact: notes.phone ? String(notes.phone) : undefined,
      };
  const email = customer.email || String(notes.email ?? "") || payment.email || "";
  const phone = address.contact ?? customer.contact ?? String(payment.contact ?? "");

  if (!address.line1 || !address.city || !address.zipcode) {
    return NextResponse.json(
      { error: `Payment ${razorpayPaymentId} went through, but no shipping address was captured.` },
      { status: 422 }
    );
  }

  const quantity = Number(notes.quantity) || 1;
  const shippingFeePaise = Number(order.shipping_fee ?? notes.shipping_fee) || 0;

  const supabase = await createServerClient();

  const { error: insertError } = await supabase.from("deck_preorders").insert({
    project_id: String(notes.project_id),
    name: address.name ?? customer.name ?? "",
    email,
    phone,
    address_line1: address.line1,
    address_line2: address.line2 || null,
    city: address.city,
    state: address.state ?? "",
    postal_code: address.zipcode,
    country: address.country === "in" || address.country === "IN" ? "India" : (address.country ?? "India"),
    quantity,
    unit_price_paise: UNIT_PRICE_PAISE,
    shipping_method: notes.shipping_method ? String(notes.shipping_method) : null,
    shipping_fee_paise: shippingFeePaise,
    total_amount_paise: Number(payment.amount),
    newsletter_opt_in: notes.newsletter_opt_in === "true",
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "This payment has already been recorded." }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email, totalPaise: Number(payment.amount) });
}
