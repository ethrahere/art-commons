// Shipping address fields collected on our own form while Razorpay Magic Checkout
// isn't enabled on the account (it collects the same fields inside its modal).
// Shared by the pre-order form and the order API so validation matches on both ends.

// Flip to "true" once Razorpay enables Magic Checkout on the account.
export const MAGIC_CHECKOUT_ENABLED = process.env.NEXT_PUBLIC_RAZORPAY_MAGIC_CHECKOUT === "true";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export interface ShippingDetails {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  shippingMethod: string;
}

export const EMPTY_SHIPPING_DETAILS: ShippingDetails = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  shippingMethod: "standard",
};

// Accepts "+91 98765 43210", "098765 43210", etc. and returns the 10-digit number.
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export type ShippingErrors = Partial<Record<keyof ShippingDetails, string>>;

export function validateShippingDetails(d: ShippingDetails, shippingMethodIds: readonly string[]): ShippingErrors {
  const errors: ShippingErrors = {};
  if (d.name.trim().length < 2) errors.name = "Enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) errors.email = "Enter a valid email";
  if (!/^[6-9]\d{9}$/.test(normalizePhone(d.phone))) errors.phone = "Enter a 10-digit Indian mobile number";
  if (d.addressLine1.trim().length < 3) errors.addressLine1 = "Enter your house / street";
  if (d.city.trim().length < 2) errors.city = "Enter your city";
  if (!(INDIAN_STATES as readonly string[]).includes(d.state)) errors.state = "Choose your state";
  if (!/^[1-9]\d{5}$/.test(d.pincode.trim())) errors.pincode = "Enter a 6-digit PIN code";
  if (!shippingMethodIds.includes(d.shippingMethod)) errors.shippingMethod = "Choose a delivery method";
  return errors;
}
