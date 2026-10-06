// Shared by the pre-order page and the API routes so the server never trusts a
// client-sent amount. Placeholder values — update once real pricing is confirmed.

export const DECK_SKU = "54-hands-deck-v1";
export const UNIT_PRICE_PAISE = 2400 * 100;
export const MAX_QUANTITY = 50;

// Delivery methods shown inside Razorpay Magic Checkout (served by
// /api/54-hands/shipping-info). India-only; fees in paise.
export const SHIPPING_METHODS = [
  { id: "standard", name: "Standard delivery", description: "5–8 business days", shipping_fee: 10000 },
  { id: "express", name: "Express delivery", description: "2–4 business days", shipping_fee: 25000 },
] as const;
