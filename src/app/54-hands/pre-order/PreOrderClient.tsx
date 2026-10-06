"use client";

import { useEffect, useState } from "react";
import { DeckBack, DeckCard } from "./DeckCard";
import { DECK } from "./deck";
import { MAX_QUANTITY, SHIPPING_METHODS, UNIT_PRICE_PAISE } from "./pricing";
import {
  EMPTY_SHIPPING_DETAILS,
  INDIAN_STATES,
  MAGIC_CHECKOUT_ENABLED,
  normalizePhone,
  validateShippingDetails,
  type ShippingDetails,
  type ShippingErrors,
} from "./address";
import styles from "./preorder.module.css";

interface Props {
  projectId: string;
  projectTitle: string;
  /** card_key → artist name, from public_card_registrations. */
  artists: Record<string, string>;
  /** Card keys dealt into the hero fan, left to right — drawn at random per request. */
  fanKeys: string[];
}

interface CheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Confirmation {
  paymentId: string;
  email: string;
  totalPaise: number;
}


const SHIPPING_METHOD_IDS = SHIPPING_METHODS.map(m => m.id);

function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function PreOrderClient({ projectId, projectTitle, artists, fanKeys }: Props) {
  const fanCards = fanKeys.map(key => DECK.find(c => c.key === key)!);
  const [quantity, setQuantity] = useState(1);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [shipping, setShipping] = useState<ShippingDetails>(EMPTY_SHIPPING_DETAILS);
  const [showErrors, setShowErrors] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<ShippingErrors>({});
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const artistNames = Object.values(artists);
  const subtotalPaise = UNIT_PRICE_PAISE * quantity;
  const selectedMethod = SHIPPING_METHODS.find(m => m.id === shipping.shippingMethod);
  const shippingPaise = MAGIC_CHECKOUT_ENABLED ? null : selectedMethod?.shipping_fee ?? 0;
  const totalPaise = subtotalPaise + (shippingPaise ?? 0);

  const fieldErrors: ShippingErrors = MAGIC_CHECKOUT_ENABLED
    ? {}
    : { ...serverFieldErrors, ...(showErrors ? validateShippingDetails(shipping, SHIPPING_METHOD_IDS) : {}) };

  useEffect(() => {
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = MAGIC_CHECKOUT_ENABLED
      ? "https://checkout.razorpay.com/v1/magic-checkout.js"
      : "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Couldn't load the payment gateway. Please refresh and try again.");
    document.body.appendChild(script);
  }, []);

  function update<K extends keyof ShippingDetails>(key: K, value: ShippingDetails[K]) {
    setShipping(s => ({ ...s, [key]: value }));
    setServerFieldErrors(e => ({ ...e, [key]: undefined }));
  }

  async function confirmPreorder(response: CheckoutResponse) {
    const res = await fetch("/api/54-hands/preorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (res.ok) {
      setConfirmation({ paymentId: response.razorpay_payment_id, email: data?.email ?? "", totalPaise: data?.totalPaise ?? totalPaise });
      window.scrollTo({ top: 0 });
    } else {
      setError(
        `Your payment went through (ID: ${response.razorpay_payment_id}) but we couldn't save your order: ${data?.error ?? "unknown error"}. Please contact us with this payment ID so we can sort it out.`
      );
    }
  }

  async function handleCheckout() {
    setError(null);

    if (!MAGIC_CHECKOUT_ENABLED && Object.keys(validateShippingDetails(shipping, SHIPPING_METHOD_IDS)).length > 0) {
      setShowErrors(true);
      document.getElementById("delivery-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setBusy(true);
    const res = await fetch("/api/54-hands/preorder/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        quantity,
        newsletterOptIn,
        ...(MAGIC_CHECKOUT_ENABLED ? {} : { shipping }),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.orderId) {
      if (data?.fields) setServerFieldErrors(data.fields);
      setError(data?.error ?? "Couldn't start checkout. Please try again.");
      setBusy(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: "The Holding",
      description: `${projectTitle} — deck pre-order (× ${quantity})`,
      order_id: data.orderId,
      theme: { color: "#d8a24a" },
      modal: { ondismiss: () => setBusy(false) },
      handler: confirmPreorder,
      ...(MAGIC_CHECKOUT_ENABLED
        ? // Magic Checkout collects contact, email, address and delivery method itself.
          { one_click_checkout: true, show_coupons: false }
        : {
            amount: data.amount,
            currency: data.currency,
            prefill: { name: shipping.name.trim(), email: shipping.email.trim(), contact: `+91${normalizePhone(shipping.phone)}` },
          }),
    });
    rzp.on("payment.failed", res => {
      setError(res.error.description);
      setBusy(false);
    });
    rzp.open();
  }

  if (confirmation) {
    return (
      <div className={styles.page}>
        <div className={styles.confirm}>
          <div className={styles.confirmFan}>
            {fanCards.slice(1, 4).map((card, i) => (
              <div key={card.key} style={{ transform: `rotate(${(i - 1) * 12}deg)` }}>
                <DeckCard card={card} artist={artists[card.key]} eager />
              </div>
            ))}
          </div>
          <div className={styles.eyebrow}>Pre-order confirmed</div>
          <h1>Your hand is dealt.</h1>
          <p>
            {quantity} × {projectTitle} deck{quantity > 1 ? "s" : ""} — {formatINR(confirmation.totalPaise)} paid, including delivery.
          </p>
          {confirmation.email && (
            <p>We&apos;ll email {confirmation.email} with shipping updates once the deck goes to print.</p>
          )}
          <p className={styles.confirmId}>Payment ID · {confirmation.paymentId}</p>
          <div style={{ marginTop: 32 }}>
            <a href="/54-hands" className={styles.buttonGhost}>
              Back to 54 Hands
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.nav}>
          <a href="/54-hands" className={styles.navLink}>
            ← 54 Hands
          </a>
          <span className={styles.eyebrow}>The Holding · Project 001</span>
        </nav>

        {/* ─── Hero ─── */}
        <header className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Pre-order · First edition</div>
            <h1 className={styles.title}>
              54 <em>Hands</em>
            </h1>
            <p className={styles.lede}>
              A deck of playing cards where <strong>every card is drawn by a different artist</strong>. Fifty-four cards,
              fifty-four artists, one shared frame.
            </p>
            <div className={styles.priceRow}>
              <span className={styles.price}>{formatINR(UNIT_PRICE_PAISE)}</span>
              <span className={styles.priceNote}>per deck · ships across India</span>
            </div>
            <div className={styles.ctaRow}>
              <a href="#checkout" className={styles.button}>
                Pre-order the deck →
              </a>
              <a href="/54-hands" className={styles.buttonGhost}>
                About the project
              </a>
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <b>54</b>
                <span>Cards</span>
              </div>
              <div className={styles.stat}>
                <b>54</b>
                <span>Artists</span>
              </div>
              <div className={styles.stat}>
                <b>1 / 54</b>
                <span>Share of sales each</span>
              </div>
            </div>
          </div>

          <div className={styles.fan} aria-hidden="true">
            <div className={`${styles.fanCard} ${styles.fanBack}`} style={{ "--i": 0, "--abs": 0, "--n": 0, transform: "translate(18px, -8px) rotate(4deg)" } as React.CSSProperties}>
              <DeckBack />
            </div>
            {fanCards.map((card, n) => {
              const i = n - (fanCards.length - 1) / 2;
              return (
                <div
                  key={card.key}
                  className={styles.fanCard}
                  style={{ "--i": i, "--abs": Math.abs(i), "--n": n + 1, zIndex: n + 1 } as React.CSSProperties}
                >
                  {/* The slot stays put so hover doesn't flicker; only this inner layer lifts out. */}
                  <div className={styles.fanLift}>
                    <DeckCard card={card} artist={artists[card.key]} eager />
                  </div>
                </div>
              );
            })}
          </div>
        </header>
      </div>

      {/* ─── Artist ticker ─── */}
      {artistNames.length > 0 && (
        <div className={styles.ticker} aria-label="Artists in the deck">
          <div className={styles.tickerTrack}>
            {[...artistNames, ...artistNames].map((name, i) => (
              <span key={i} className={styles.tickerItem} aria-hidden={i >= artistNames.length}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.container}>
        {/* ─── Principles ─── */}
        <section className={styles.section}>
          <div className={styles.principles}>
            <div className={styles.principle}>
              <span className={styles.principleNum}>01</span>
              <h3>One card, one artist</h3>
              <p>Each of the 52 cards and both jokers was made by a different artist — no two hands alike.</p>
            </div>
            <div className={styles.principle}>
              <span className={styles.principleNum}>02</span>
              <h3>One shared frame</h3>
              <p>
                Every artwork sits in the same template by The Holding, with a common back — so the deck plays as one,
                at 57 × 88 mm.
              </p>
            </div>
            <div className={styles.principle}>
              <span className={styles.principleNum}>03</span>
              <h3>Every sale, shared</h3>
              <p>Each participating artist receives an equal share of the deck&apos;s sales revenue.</p>
            </div>
          </div>
        </section>

        {/* ─── Checkout ─── */}
        <section id="checkout" className={styles.section} style={{ paddingTop: 0 }}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.eyebrow}>Pre-order</div>
              <h2 className={styles.sectionTitle}>
                Reserve your <em>deck</em>
              </h2>
            </div>
          </div>

          <div className={styles.checkout}>
            <div className={styles.panel} id="delivery-details">
              {MAGIC_CHECKOUT_ENABLED ? (
                <>
                  <p className={styles.magicNote}>
                    Choose how many decks you&apos;d like. You&apos;ll add your delivery address, pick a delivery option and
                    pay in Razorpay&apos;s secure checkout.
                  </p>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={newsletterOptIn} onChange={e => setNewsletterOptIn(e.target.checked)} />
                    Keep me posted on future drops and news
                  </label>
                </>
              ) : (
                <>
                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Contact</legend>
                    <div className={styles.fields}>
                      <Field label="Full name" error={fieldErrors.name} className={styles.full}>
                        <input className={fieldErrors.name ? styles.inputError : styles.input} autoComplete="name" value={shipping.name} onChange={e => update("name", e.target.value)} />
                      </Field>
                      <Field label="Email" error={fieldErrors.email}>
                        <input type="email" className={fieldErrors.email ? styles.inputError : styles.input} autoComplete="email" placeholder="you@example.com" value={shipping.email} onChange={e => update("email", e.target.value)} />
                      </Field>
                      <Field label="Mobile number" error={fieldErrors.phone}>
                        <input type="tel" className={fieldErrors.phone ? styles.inputError : styles.input} autoComplete="tel" placeholder="98765 43210" value={shipping.phone} onChange={e => update("phone", e.target.value)} />
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Delivery address</legend>
                    <div className={styles.fields}>
                      <Field label="House / flat, street" error={fieldErrors.addressLine1} className={styles.full}>
                        <input className={fieldErrors.addressLine1 ? styles.inputError : styles.input} autoComplete="address-line1" value={shipping.addressLine1} onChange={e => update("addressLine1", e.target.value)} />
                      </Field>
                      <Field label="Area, landmark" optional className={styles.full}>
                        <input className={styles.input} autoComplete="address-line2" value={shipping.addressLine2} onChange={e => update("addressLine2", e.target.value)} />
                      </Field>
                      <Field label="PIN code" error={fieldErrors.pincode}>
                        <input inputMode="numeric" maxLength={6} className={fieldErrors.pincode ? styles.inputError : styles.input} autoComplete="postal-code" value={shipping.pincode} onChange={e => update("pincode", e.target.value.replace(/\D/g, ""))} />
                      </Field>
                      <Field label="City" error={fieldErrors.city}>
                        <input className={fieldErrors.city ? styles.inputError : styles.input} autoComplete="address-level2" value={shipping.city} onChange={e => update("city", e.target.value)} />
                      </Field>
                      <Field label="State" error={fieldErrors.state}>
                        <select className={fieldErrors.state ? styles.inputError : styles.input} autoComplete="address-level1" value={shipping.state} onChange={e => update("state", e.target.value)}>
                          <option value="" disabled>
                            Select state
                          </option>
                          {INDIAN_STATES.map(s => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Country">
                        <input className={styles.input} value="India" disabled />
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Delivery method</legend>
                    <div className={styles.methods}>
                      {SHIPPING_METHODS.map(m => (
                        <label key={m.id} className={shipping.shippingMethod === m.id ? styles.methodActive : styles.method}>
                          <input type="radio" name="shipping-method" checked={shipping.shippingMethod === m.id} onChange={() => update("shippingMethod", m.id)} />
                          <span className={styles.methodText}>
                            <b>{m.name}</b>
                            <span>{m.description}</span>
                          </span>
                          <span className={styles.methodFee}>{m.shipping_fee ? formatINR(m.shipping_fee) : "Free"}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={newsletterOptIn} onChange={e => setNewsletterOptIn(e.target.checked)} />
                    Keep me posted on future drops and news
                  </label>
                </>
              )}
            </div>

            <aside className={`${styles.panel} ${styles.summary}`}>
              <div className={styles.summaryProduct}>
                <div className={styles.summaryThumb}>
                  <DeckBack />
                  <DeckCard card={fanCards[1]} artist={artists[fanCards[1].key]} />
                </div>
                <div>
                  <h3>{projectTitle}</h3>
                  <p>Printed deck · 54 cards</p>
                </div>
              </div>

              <div className={styles.qtyRow}>
                <span className={styles.qtyLabel}>Quantity</span>
                <div className={styles.stepper}>
                  <button type="button" aria-label="Fewer decks" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                    −
                  </button>
                  <span>{quantity}</span>
                  <button type="button" aria-label="More decks" disabled={quantity >= MAX_QUANTITY} onClick={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))}>
                    +
                  </button>
                </div>
              </div>

              <div className={styles.lines}>
                <div className={styles.line}>
                  <span>
                    {quantity} × {formatINR(UNIT_PRICE_PAISE)}
                  </span>
                  <span>{formatINR(subtotalPaise)}</span>
                </div>
                <div className={styles.line}>
                  <span>Delivery{selectedMethod && !MAGIC_CHECKOUT_ENABLED ? ` · ${selectedMethod.name.replace(" delivery", "")}` : ""}</span>
                  <span>{shippingPaise === null ? "At checkout" : shippingPaise ? formatINR(shippingPaise) : "Free"}</span>
                </div>
              </div>

              <div className={styles.total}>
                <span>{shippingPaise === null ? "Subtotal" : "Total"}</span>
                <span>{formatINR(totalPaise)}</span>
              </div>

              <button type="button" className={styles.payButton} onClick={handleCheckout} disabled={busy || !scriptReady}>
                {busy ? "Processing…" : MAGIC_CHECKOUT_ENABLED ? "Checkout →" : `Pay ${formatINR(totalPaise)} →`}
              </button>

              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.secure}>🔒 Secure payment via Razorpay</div>
              <p className={styles.disclaimer}>Price is a placeholder and may change before the deck ships.</p>
            </aside>
          </div>
        </section>

        <footer className={styles.footer}>
          <span className={styles.eyebrow}>54 Hands · The Holding</span>
          <a href="/54-hands" className={styles.navLink}>
            About the project →
          </a>
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.field} ${className ?? ""}`}>
      <label>
        {label} {optional && <small>(optional)</small>}
      </label>
      {children}
      {error && <div className={styles.fieldError}>{error}</div>}
    </div>
  );
}
