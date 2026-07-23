"use client";

import { useState } from "react";
import RazorpayButton from "@/components/checkout/RazorpayButton";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";
const BG = "#0e0d0b";
const BORDER = "#262119";

// Placeholder price — update once real pricing is confirmed.
const UNIT_PRICE_INR = 999;

interface Props {
  projectId: string;
  projectTitle: string;
}

function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function PreOrderClient({ projectId, projectTitle }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const totalPaise = UNIT_PRICE_INR * 100 * quantity;

  const formValid =
    name.trim().length > 1 &&
    email.includes("@") &&
    phone.trim().length >= 6 &&
    addressLine1.trim().length > 0 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    postalCode.trim().length > 0 &&
    quantity >= 1;

  async function handlePaymentSuccess(response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/54-hands/preorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        quantity,
        unitPricePaise: UNIT_PRICE_INR * 100,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setOrderId(response.razorpay_payment_id);
    } else {
      const data = await res.json().catch(() => null);
      setError(
        `Your payment went through (ID: ${response.razorpay_payment_id}) but we couldn't save your order details: ${data?.error ?? "unknown error"}. Please contact us with this payment ID so we can sort it out.`
      );
    }
  }

  if (orderId) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: "#efe9dd", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "72px 24px", textAlign: "center" as const }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(147,168,119,0.12)", border: "1px solid #3a4430", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>✓</div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, fontWeight: 400, margin: "0 0 10px" }}>Pre-order confirmed</h1>
          <p style={{ color: "#9a9286", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 6px" }}>
            {quantity} × {projectTitle} deck{quantity > 1 ? "s" : ""} — {formatINR(totalPaise)} paid.
          </p>
          <p style={{ color: "#6f6759", fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", margin: 0 }}>
            Payment ID: {orderId}
          </p>
          <p style={{ color: "#847b6d", fontSize: 13.5, lineHeight: 1.6, marginTop: 20 }}>
            We'll email {email} with shipping updates once the deck goes into production.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#efe9dd", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#5f594f", textTransform: "uppercase" as const, marginBottom: 10 }}>
          The Holding · Pre-order
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 44, fontWeight: 400, margin: "0 0 12px", lineHeight: 1.05 }}>
          Pre-order {projectTitle}
        </h1>
        <p style={{ color: "#9a9286", fontSize: 15, lineHeight: 1.6, margin: "0 0 8px" }}>
          Reserve your printed deck. Every card is fully claimed and in production — this is for buying the finished physical deck, not claiming a card.
        </p>
        <p style={{ color: "#5f594f", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", margin: "0 0 32px" }}>
          Price shown is a placeholder and subject to change before shipping.
        </p>

        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "26px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.16em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 6 }}>Price per deck</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26 }}>{formatINR(UNIT_PRICE_INR * 100)}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.16em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 6, textAlign: "right" as const }}>Quantity</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: "#c9bfaf", cursor: "pointer", fontSize: 15 }}>−</button>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, minWidth: 20, textAlign: "center" as const }}>{quantity}</span>
                <button type="button" onClick={() => setQuantity(q => Math.min(20, q + 1))} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: "#c9bfaf", cursor: "pointer", fontSize: 15 }}>+</button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Full name</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Email</div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Phone</div>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
                  style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Address line 1</div>
              <input value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="House / street / area"
                style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Address line 2 <span style={{ color: "#4a4538" }}>(optional)</span></div>
              <input value={addressLine2} onChange={e => setAddressLine2(e.target.value)} placeholder="Apartment, landmark, etc."
                style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>City</div>
                <input value={city} onChange={e => setCity(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>State</div>
                <input value={state} onChange={e => setState(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Postal code</div>
                <input value={postalCode} onChange={e => setPostalCode(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Country</div>
              <input value={country} onChange={e => setCountry(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }} />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 18, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#e07070", background: "rgba(224,112,112,0.08)", border: "1px solid rgba(224,112,112,0.2)", borderRadius: 8, padding: "12px 14px", lineHeight: 1.6 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.16em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 4 }}>Total</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: ACCENT }}>{formatINR(totalPaise)}</div>
            </div>
            {formValid && !saving ? (
              <RazorpayButton
                amount={totalPaise}
                description={`${projectTitle} — deck pre-order (× ${quantity})`}
                label={`Pay ${formatINR(totalPaise)} →`}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => setError(msg)}
              />
            ) : (
              <button disabled style={{ height: 38, padding: "0 22px", borderRadius: 10, border: "none", background: "#2a241b", color: "#5f594f", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, fontWeight: 700, cursor: "not-allowed" }}>
                {saving ? "Saving order…" : "Fill in all required fields"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
