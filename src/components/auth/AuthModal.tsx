"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#d8a24a";
const BG = "#0e0d0b";
const PANEL = "#15130f";
const BORDER = "#2c271f";

type Mode = "login" | "signup";

interface AuthModalProps {
  initialMode?: Mode;
  onClose: () => void;
}

// ---------- shared primitives ----------

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: "#847b6d", textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder, autoFocus }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      required
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: BG,
        border: `1px solid ${focused ? ACCENT : BORDER}`,
        borderRadius: 10,
        color: "#efe9dd",
        padding: "11px 14px",
        fontSize: 14,
        fontFamily: "'Hanken Grotesk', sans-serif",
        outline: "none",
        transition: "border-color 0.15s",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function PrimaryButton({ children, loading, disabled, onClick, type = "submit" }: {
  children: React.ReactNode; loading?: boolean; disabled?: boolean; onClick?: () => void; type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: "100%",
        height: 46,
        borderRadius: 11,
        border: "none",
        background: loading || disabled ? "#6b5a32" : ACCENT,
        color: "#1a1408",
        fontFamily: "'Hanken Grotesk', sans-serif",
        fontSize: 15,
        fontWeight: 700,
        cursor: loading || disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#e07070", background: "rgba(224,112,112,0.08)", border: "1px solid rgba(224,112,112,0.2)", borderRadius: 8, padding: "10px 12px" }}>
      {msg}
    </div>
  );
}

// ---------- Razorpay payment button ----------

function RazorpayPaymentButton() {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!formRef.current || formRef.current.querySelector("script")) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute("data-payment_button_id", "pl_T7Jqphm1WeJAYj");
    script.async = true;
    formRef.current.appendChild(script);
  }, []);
  return <form ref={formRef} style={{ display: "flex", justifyContent: "center" }} />;
}

// ---------- Login form ----------

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={setEmail} autoFocus />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" value={password} onChange={setPassword} />
      </div>
      {error && <ErrorMsg msg={error} />}
      <PrimaryButton loading={loading}>{loading ? "Signing in…" : "Sign in"}</PrimaryButton>
      <p style={{ textAlign: "center", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: "#847b6d", margin: 0 }}>
        Not a member?{" "}
        <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: ACCENT, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
          Join the commons →
        </button>
      </p>
    </form>
  );
}

// ---------- Signup form ----------

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const supabase = createClient();
  const [step, setStep] = useState<"pay" | "account" | "done">("account");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, membership_type: "none" },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep("done");
    }
  }

  if (step === "done") {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(216,162,74,0.12)", border: "1px solid rgba(216,162,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>
          ✉
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 10px" }}>Check your email</h2>
        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, color: "#9a9286", lineHeight: 1.6, margin: "0 0 6px" }}>
          We sent a confirmation link to
        </p>
        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, color: "#efe9dd", fontWeight: 600, margin: "0 0 16px" }}>{email}</p>
        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: "#6f6759", lineHeight: 1.6, margin: 0 }}>
          Click the link to activate your account, then come back to sign in.
        </p>
        <button
          type="button"
          onClick={onSwitch}
          style={{ marginTop: 24, background: "none", border: `1px solid ${BORDER}`, borderRadius: 10, color: "#c5bcae", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, cursor: "pointer", padding: "10px 20px" }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (step === "pay") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#1a1408", fontWeight: 700 }}>1</div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: ACCENT, letterSpacing: "0.1em" }}>PAYMENT</span>
          </div>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5f594f" }}>2</div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5f594f", letterSpacing: "0.1em" }}>ACCOUNT</span>
          </div>
        </div>

        {/* Payment card */}
        <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "22px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, lineHeight: 1 }}>₹100</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.16em", color: "#6f6759", textTransform: "uppercase" as const, marginTop: 4 }}>Lifetime membership</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#9a9286", lineHeight: 1.5 }}>One-time payment.<br />Full access forever.</div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 18, marginTop: 16 }}>
            <RazorpayPaymentButton />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, justifyContent: "center" }}>
            <span style={{ fontSize: 11, color: "#3a342b" }}>🔒</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#3a342b", letterSpacing: "0.1em" }}>SECURED BY RAZORPAY</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStep("account")}
          style={{ background: "none", border: "none", color: "#847b6d", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, cursor: "pointer", padding: "4px 0", textDecoration: "underline", textDecorationColor: "#3a342b" }}
        >
          I've already paid — continue →
        </button>

        <p style={{ textAlign: "center", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: "#847b6d", margin: 0 }}>
          Already a member?{" "}
          <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: ACCENT, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            Sign in →
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <Label>Your name</Label>
        <Input value={displayName} onChange={setDisplayName} placeholder="Your artist name" autoFocus />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={setEmail} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" value={password} onChange={setPassword} placeholder="8+ characters" />
      </div>

      {error && <ErrorMsg msg={error} />}

      <PrimaryButton loading={loading}>{loading ? "Creating account…" : "Create account"}</PrimaryButton>

      <p style={{ textAlign: "center", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: "#847b6d", margin: 0 }}>
        Already a member?{" "}
        <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: ACCENT, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
          Sign in →
        </button>
      </p>
    </form>
  );
}

// ---------- Modal shell ----------

export default function AuthModal({ initialMode = "login", onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,9,8,0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: PANEL,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: "36px 32px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: "transparent", border: `1px solid ${BORDER}`, color: "#6f6759", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
        >
          ×
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 22, height: 22, flexShrink: 0, transform: "rotate(45deg)", border: `1.5px solid ${ACCENT}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 7, height: 7, background: ACCENT, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20 }}>The Holding</span>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", background: BG, borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 9,
                border: "none",
                background: mode === m ? PANEL : "transparent",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.4)" : "none",
                color: mode === m ? "#efe9dd" : "#6f6759",
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13.5,
                fontWeight: mode === m ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {m === "login" ? "Sign in" : "Join the commons"}
            </button>
          ))}
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 400, margin: "0 0 6px", lineHeight: 1.1 }}>
            {mode === "login" ? "Welcome back." : "A place to be held."}
          </h2>
          <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13.5, color: "#9a9286", margin: 0 }}>
            {mode === "login"
              ? "Sign in to your account."
              : "Join ten founding artists in the commons."}
          </p>
        </div>

        {mode === "login"
          ? <LoginForm onSwitch={() => setMode("signup")} />
          : <SignupForm onSwitch={() => setMode("login")} />
        }
      </div>
    </div>
  );
}
