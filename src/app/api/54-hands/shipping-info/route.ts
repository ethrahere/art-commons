import { NextResponse } from "next/server";
import { SHIPPING_METHODS } from "@/app/54-hands/pre-order/pricing";

// Magic Checkout "Shipping Info API". Razorpay calls this (unauthenticated) with the
// customer's saved/entered addresses and shows the returned delivery methods + fees
// in its checkout. Register the URL in Dashboard → Magic Checkout → Shipping Setup
// → API: https://<your-domain>/api/54-hands/shipping-info

interface IncomingAddress {
  id: string;
  zipcode: string;
  state_code?: string;
  country: string;
}

async function handle(request: Request) {
  const body = await request.json().catch(() => null);
  const addresses: IncomingAddress[] = Array.isArray(body?.addresses) ? body.addresses : [];

  return NextResponse.json({
    addresses: addresses.map(address => {
      const inIndia = address.country?.toUpperCase() === "IN";
      return {
        id: address.id,
        zipcode: address.zipcode,
        state_code: address.state_code,
        country: address.country,
        shipping_methods: SHIPPING_METHODS.map(method => ({
          ...method,
          serviceable: inIndia,
          // No cash on delivery for pre-orders.
          cod: false,
          cod_fee: 0,
        })),
      };
    }),
  });
}

export { handle as GET, handle as POST };
