import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import type { Orders } from "razorpay/dist/types/orders";
import { DECK_SKU, MAX_QUANTITY, SHIPPING_METHODS, UNIT_PRICE_PAISE } from "@/app/54-hands/pre-order/pricing";
import {
  MAGIC_CHECKOUT_ENABLED,
  normalizePhone,
  validateShippingDetails,
  type ShippingDetails,
} from "@/app/54-hands/pre-order/address";

// Creates the Razorpay order for a deck pre-order.
//
// Magic Checkout: line_items + line_items_total switch checkout.js into Magic
// Checkout, which collects address + delivery method and adds the fee itself.
//
// Fallback (Standard Checkout): the address and delivery method come from our own
// form, the delivery fee is added to the amount here, and the address is stored in
// the order's notes so the confirm route can read it back from Razorpay.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const projectId: string = body?.projectId ?? "";
  const quantity = Math.floor(Number(body?.quantity) || 0);
  const newsletterOptIn = Boolean(body?.newsletterOptIn);

  if (!projectId || quantity < 1 || quantity > MAX_QUANTITY) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const lineItemsTotal = UNIT_PRICE_PAISE * quantity;
  const notes: Record<string, string | number> = {
    project_id: projectId,
    quantity,
    newsletter_opt_in: newsletterOptIn ? "true" : "false",
  };

  let orderBody: Record<string, unknown>;

  if (MAGIC_CHECKOUT_ENABLED) {
    orderBody = {
      amount: lineItemsTotal,
      line_items_total: lineItemsTotal,
      line_items: [
        {
          sku: DECK_SKU,
          variant_id: DECK_SKU,
          name: "54 Hands — printed deck",
          description: "Pre-order of the printed 54 Hands card deck",
          price: UNIT_PRICE_PAISE,
          offer_price: UNIT_PRICE_PAISE,
          quantity,
        },
      ],
    };
  } else {
    const shipping: ShippingDetails = {
      name: String(body?.shipping?.name ?? ""),
      email: String(body?.shipping?.email ?? ""),
      phone: String(body?.shipping?.phone ?? ""),
      addressLine1: String(body?.shipping?.addressLine1 ?? ""),
      addressLine2: String(body?.shipping?.addressLine2 ?? ""),
      city: String(body?.shipping?.city ?? ""),
      state: String(body?.shipping?.state ?? ""),
      pincode: String(body?.shipping?.pincode ?? ""),
      shippingMethod: String(body?.shipping?.shippingMethod ?? ""),
    };
    const errors = validateShippingDetails(shipping, SHIPPING_METHODS.map(m => m.id));
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Please check your delivery details.", fields: errors }, { status: 400 });
    }

    const method = SHIPPING_METHODS.find(m => m.id === shipping.shippingMethod)!;
    orderBody = { amount: lineItemsTotal + method.shipping_fee };

    // Razorpay notes: max 15 keys, 256 chars each.
    Object.assign(notes, {
      shipping_method: method.id,
      shipping_fee: method.shipping_fee,
      name: shipping.name.trim().slice(0, 256),
      email: shipping.email.trim().slice(0, 256),
      phone: normalizePhone(shipping.phone),
      line1: shipping.addressLine1.trim().slice(0, 256),
      line2: shipping.addressLine2.trim().slice(0, 256),
      city: shipping.city.trim().slice(0, 256),
      state: shipping.state,
      pincode: shipping.pincode.trim(),
    });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  try {
    // SDK typings mark optional Magic Checkout fields (type, tax_amount, weight…) as required.
    const order = await razorpay.orders.create({
      ...orderBody,
      currency: "INR",
      receipt: `54h_${Date.now()}`,
      // Read back in the confirm route, so these come from our server, not the client.
      notes,
    } as unknown as Orders.RazorpayOrderCreateRequestBody);

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error("[54-hands/preorder/order]", error);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
