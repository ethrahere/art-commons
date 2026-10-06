// Shared by the pre-order page and the API routes so the server never trusts a
// client-sent amount. ₹710 is the invite-only pre-order price.

export const DECK_SKU = "54-hands-deck-v1";
export const UNIT_PRICE_PAISE = 710 * 100;
export const MAX_QUANTITY = 50;

// Owner-only live test: a checkout opened with ?test=<PREORDER_TEST_KEY> charges
// this total for one deck, delivery included, so the live payment flow can be
// tried cheaply without changing the price for anyone else.
export const TEST_TOTAL_PAISE = 10 * 100;

// Delivery methods shown inside Razorpay Magic Checkout (served by
// /api/54-hands/shipping-info). India-only; fees in paise.
export const SHIPPING_METHODS = [
  { id: "standard", name: "Standard delivery", description: "5–8 business days", shipping_fee: 10000 },
  { id: "express", name: "Express delivery", description: "2–4 business days", shipping_fee: 25000 },
] as const;
