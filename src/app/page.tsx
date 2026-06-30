"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

const ACCENT = "#d8a24a";
const BG = "#0e0d0b";
const PANEL = "#15130f";

type ModalMode = "login" | "signup" | null;

const FEATURES = [
  {
    icon: "$",
    title: "A shared treasury",
    body: "Revenue from every drop splits equally between the participating artists and a common treasury — which funds materials, exhibition costs, and the infrastructure itself.",
  },
  {
    icon: "▤",
    title: "One storefront, shared reach",
    body: "Every drop is marketed collectively. Smaller artists gain the reach of the whole; no one builds visibility alone.",
  },
  {
    icon: "◈",
    title: "A knowledge commons",
    body: "Grants, open calls, leads, and the invisible admin labour — researched once and shared openly across every member.",
  },
  {
    icon: "⊚",
    title: "Governed by consensus",
    body: "No executive, no hierarchy. The founding artists hold equal say over the treasury and who joins next — and supporters can back the commons directly.",
  },
];

export default function LandingPage() {
  const [modal, setModal] = useState<ModalMode>(null);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#efe9dd", fontFamily: "'Hanken Grotesk', system-ui, sans-serif", WebkitFontSmoothing: "antialiased" }}>

      {modal && (
        <AuthModal initialMode={modal} onClose={() => setModal(null)} />
      )}

      {/* NAV */}
      <nav style={{ maxWidth: 1240, margin: "0 auto", padding: "26px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 24, height: 24, flexShrink: 0, transform: "rotate(45deg)", border: `1.5px solid ${ACCENT}`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 7, height: 7, background: ACCENT, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>The Holding</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <a href="/directory" style={{ fontSize: 14, color: "#9a9286", textDecoration: "none" }}>Directory</a>
          <a href="/finances" style={{ fontSize: 14, color: "#9a9286", textDecoration: "none" }}>Opportunities</a>
          <a href="/community" style={{ fontSize: 14, color: "#9a9286", textDecoration: "none" }}>Community</a>
          <button
            onClick={() => setModal("login")}
            style={{ fontSize: 14, color: "#c5bcae", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Hanken Grotesk', sans-serif" }}
          >
            Sign in
          </button>
          <button
            onClick={() => setModal("signup")}
            style={{ fontSize: 13.5, fontWeight: 600, background: ACCENT, color: "#1a1408", padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}
          >
            Request to join
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "64px 40px 72px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "#847b6d", border: "1px solid #2c271f", padding: "7px 13px", borderRadius: 999, marginBottom: 30 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#93a877", flexShrink: 0 }} />
            An artist-led economic commons · India
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 76, lineHeight: 0.98, letterSpacing: "-0.01em", margin: "0 0 26px" }}>
            A place to be <em style={{ fontStyle: "italic", color: ACCENT }}>held</em>.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "#b3aa9d", maxWidth: 470, margin: "0 0 36px" }}>
            A shared treasury, a collective storefront, and an open knowledge commons — pooled resources and consensus governance, owned by the artists themselves.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setModal("signup")}
              style={{ display: "inline-flex", alignItems: "center", gap: 9, background: ACCENT, color: "#1a1408", fontSize: 15, fontWeight: 600, padding: "14px 24px", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}
            >
              Request to join →
            </button>
            <a
              href="/directory"
              style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid #2c271f", color: "#c5bcae", fontSize: 15, fontWeight: 500, padding: "14px 24px", borderRadius: 11, textDecoration: "none" }}
            >
              Browse the directory
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 34, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6f6759" }}>
            <div style={{ display: "flex" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#3a2f1c,#211d16)", border: `1.5px solid ${BG}`, marginLeft: i === 0 ? 0 : -9 }} />
              ))}
            </div>
            Beginning with ten founding artists
          </div>
        </div>

        {/* Hero visual */}
        <div style={{ position: "relative", aspectRatio: "1/1", border: "1px solid #262119", borderRadius: 20, background: PANEL, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: "78%", height: "78%", border: "1px solid #2a241b", borderRadius: "50%" }} />
          <div style={{ position: "absolute", width: "56%", height: "56%", border: "1px solid #2f281d", borderRadius: "50%" }} />
          <div style={{ position: "absolute", width: "34%", height: "34%", border: "1px solid #382f20", borderRadius: "50%" }} />
          <div style={{ width: 64, height: 64, transform: "rotate(45deg)", border: `2px solid ${ACCENT}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px rgba(216,162,74,0.25)` }}>
            <div style={{ width: 22, height: 22, background: ACCENT, borderRadius: 6 }} />
          </div>
          <div style={{ position: "absolute", bottom: 18, left: 18, right: 18, display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6f6759" }}>
            <span>The First Gathering</span>
            <span>Held in common</span>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section style={{ borderTop: "1px solid #221e18", borderBottom: "1px solid #221e18" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "38px 40px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {[
            { n: "10", label: "founding artists" },
            { n: "54", label: "Hands · the first drop" },
            { n: "50:50", label: "artists / treasury split" },
            { n: "0", label: "executives · artist-governed" },
          ].map(({ n, label }) => (
            <div key={label}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 40, lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#847b6d", marginTop: 8 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ maxWidth: 560, marginBottom: 48 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: ACCENT, marginBottom: 16 }}>What holds you</div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 44, lineHeight: 1.05, margin: 0 }}>Four layers, one commons.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
          {FEATURES.map(({ icon, title, body }) => (
            <div key={title} style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 28 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(216,162,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, color: ACCENT, fontFamily: "'Instrument Serif', serif", fontSize: 19 }}>
                {icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#9a9286", margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "0 40px 90px" }}>
        <div style={{ position: "relative", overflow: "hidden", border: "1px solid #2a241b", borderRadius: 20, background: PANEL, padding: "64px 48px", textAlign: "center" }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 260, height: 260, border: "1px solid #2a241b", borderRadius: "50%", opacity: 0.6 }} />
          <h2 style={{ position: "relative", fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 48, lineHeight: 1.04, margin: "0 0 18px" }}>
            Your practice deserves<br />somewhere to land.
          </h2>
          <p style={{ position: "relative", fontSize: 16.5, color: "#b3aa9d", maxWidth: 440, margin: "0 auto 30px" }}>
            Membership is by request while we grow. Tell us about your work and we&apos;ll be in touch.
          </p>
          <button
            onClick={() => setModal("signup")}
            style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 9, background: ACCENT, color: "#1a1408", fontSize: 15, fontWeight: 600, padding: "14px 26px", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}
          >
            Request to join →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #221e18" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6f6759" }}>
          <span>The Holding — an artist-led commons, India</span>
          <div style={{ display: "flex", gap: 22 }}>
            <button onClick={() => setModal("login")} style={{ background: "none", border: "none", color: "#6f6759", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>Sign in</button>
            <a href="#" style={{ color: "#6f6759" }}>Manifesto</a>
            <a href="#" style={{ color: "#6f6759" }}>Contact</a>
            <a href="#" style={{ color: "#6f6759" }}>Terms</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
