"use client";

import { useEffect, useState } from "react";

interface RazorpayButtonProps {
  amount: number;
  currency?: string;
  description?: string;
  label?: string;
  onSuccess?: (response: RazorpayResponse) => void;
  onError?: (message: string) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (res: { error: { description: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export default function RazorpayButton({
  amount,
  currency = "INR",
  description,
  label = "Pay now",
  onSuccess,
  onError,
}: RazorpayButtonProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Failed to load payment gateway");
    document.body.appendChild(script);
  }, []);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency }),
      });

      if (!orderRes.ok) {
        const { error } = await orderRes.json();
        throw new Error(error ?? "Could not create order");
      }

      const { order_id, amount: orderAmount, currency: orderCurrency } =
        await orderRes.json();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: orderCurrency,
        name: "Art Commons",
        description,
        order_id,
        theme: { color: "#e8a045" },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (response: RazorpayResponse) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            onSuccess?.(response);
          } else {
            const { error } = await verifyRes.json();
            const msg = error ?? "Payment verification failed";
            setError(msg);
            onError?.(msg);
          }
          setLoading(false);
        },
      });

      rzp.on("payment.failed", (res) => {
        const msg = res.error.description;
        setError(msg);
        onError?.(msg);
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setError(msg);
      onError?.(msg);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || !scriptReady}
        className="bg-[var(--color-accent)] text-[var(--color-canvas)] px-5 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
      >
        {loading ? "Processing…" : label}
      </button>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
