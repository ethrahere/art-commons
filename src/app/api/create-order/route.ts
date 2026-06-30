import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const { amount, currency = "INR", receipt } = await request.json();

    if (!amount || Number(amount) < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise (₹1)" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    console.log("[create-order] key_id:", keyId, "| key_secret length:", keySecret?.length);

    const razorpay = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    });

    const order = await razorpay.orders.create({
      amount: Number(amount),
      currency,
      receipt: receipt ?? `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[create-order]", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
