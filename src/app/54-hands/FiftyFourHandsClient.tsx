"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback, createContext, useContext } from "react";
import type { Project } from "@/types";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/BnlDu61paFZLlBLuqfcosK?mode=gi_t";
const ARTWORK_DEADLINE = "20th July";

// ─── Theme (day / night) ──────────────────────────────────────────────────────
type ThemeMode = "day" | "night";

interface ColorTokens {
  bg: string;
  panel: string;
  sunken: string;
  controlBg: string;
  border: string;
  divider: string;
  inputBorder: string;
  textPrimary: string;
  textSecondary: string;
  textBody: string;
  textMuted: string;
  textLabel: string;
  textFaint: string;
  textFainter: string;
  textFaintest: string;
  surfaceInactive: string;
  ghostNumber: string;
  ghostBorder: string;
  dotMuted: string;
  accent: string;
  accentRgb: string;
  accentOnAccent: string;
  success: string;
  successRgb: string;
  successBorder: string;
  whatsapp: string;
  error: string;
  errorRgb: string;
  conflict: string;
  redSuit: string;
}

const THEMES: Record<ThemeMode, ColorTokens> = {
  night: {
    bg: "#0e0d0b",
    panel: "#15130f",
    sunken: "#111009",
    controlBg: "#1a1814",
    border: "#262119",
    divider: "#1e1b15",
    inputBorder: "#2c271f",
    textPrimary: "#efe9dd",
    textSecondary: "#c9bfaf",
    textBody: "#9a9286",
    textMuted: "#847b6d",
    textLabel: "#6f6759",
    textFaint: "#5f594f",
    textFainter: "#4a4538",
    textFaintest: "#3a342b",
    surfaceInactive: "#2a241b",
    ghostNumber: "#221e17",
    ghostBorder: "#2a2519",
    dotMuted: "#2a251d",
    accent: "#d8a24a",
    accentRgb: "216,162,74",
    accentOnAccent: "#1a1408",
    success: "#93a877",
    successRgb: "147,168,119",
    successBorder: "#3a4430",
    whatsapp: "#25d366",
    error: "#e07070",
    errorRgb: "224,112,112",
    conflict: "#d09a6a",
    redSuit: "#c97b6a",
  },
  day: {
    bg: "#f6f2ea",
    panel: "#ffffff",
    sunken: "#efe8d8",
    controlBg: "#f1ebe0",
    border: "#e4dcc8",
    divider: "#ece3d0",
    inputBorder: "#d8cdb4",
    textPrimary: "#241f16",
    textSecondary: "#3c3527",
    textBody: "#5c5240",
    textMuted: "#79705c",
    textLabel: "#8f8571",
    textFaint: "#a49a84",
    textFainter: "#b6ac95",
    textFaintest: "#c7bea8",
    surfaceInactive: "#e2d9c4",
    ghostNumber: "#e8e1d0",
    ghostBorder: "#ece5d5",
    dotMuted: "#ded5c0",
    accent: "#b9762c",
    accentRgb: "185,118,44",
    accentOnAccent: "#fff8ec",
    success: "#4f7a3a",
    successRgb: "79,122,58",
    successBorder: "#c7d8b3",
    whatsapp: "#1a9950",
    error: "#c23c3c",
    errorRgb: "194,60,60",
    conflict: "#a3672c",
    redSuit: "#b0503f",
  },
};

const THEME_STORAGE_KEY = "54hands-theme";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorTokens;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: "night", colors: THEMES.night, toggle: () => {} });

function useTheme() {
  return useContext(ThemeContext);
}

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
type Suit = (typeof SUITS)[number];

const RED_SUITS = new Set(["♥", "♦"]);
function suitColor(suit: Suit | string, T: ColorTokens): string {
  return RED_SUITS.has(suit) ? T.redSuit : T.textSecondary;
}

export interface PublicRegistration {
  name: string;
  card_key: string;
}

type RegistrationResult =
  | { status: "success"; card: string }
  | { status: "already_registered"; card: string }
  | { status: "full" }
  | { status: "conflict" };

interface Props {
  project: Project;
  nextProject: Project | null;
  initialRegistrations: PublicRegistration[];
  formUrl: string;
}

function parseCard(key: string): { value: string; suit: string } | null {
  if (key === "Joker Red") return { value: "Joker", suit: "♥" };
  if (key === "Joker Black") return { value: "Joker", suit: "♠" };
  const suit = key.slice(-1);
  const value = key.slice(0, -1);
  return { value, suit };
}

// ─── Canvas constants — print-ready 300 DPI, 2.5 × 3.5 in playing card ──────
const CW = 750;   // 2.5 in × 300 dpi
const CH = 1050;  // 3.5 in × 300 dpi
const ART_W = 540; // 1.8 in × 300 dpi
const ART_H = 840; // 2.8 in × 300 dpi
const ART_X = 105; // (750 − 540) / 2
const ART_Y = 105; // (1050 − 840) / 2
const CARD_DISPLAY_W = 300; // 2.5× downscale for screen
const CARD_DISPLAY_H = 420;
const HANDLE_X = 105;   // left-aligned with artwork area
const HANDLE_BASELINE = 998; // matches reference card-front.png placement

// ─── Small card face (used in result panel) ───────────────────────────────────
function CardFace({ cardKey, large }: { cardKey: string; large?: boolean }) {
  const { colors: T } = useTheme();
  const parsed = parseCard(cardKey);
  if (!parsed) return null;
  const { value, suit } = parsed;
  const color = suitColor(suit, T);
  const size = large ? 120 : 52;
  const fontSize = large ? 42 : 16;
  const valueFontSize = large ? 18 : 8;
  return (
    <div style={{ width: size, height: Math.round(size * 1.4), borderRadius: large ? 12 : 6, background: T.panel, border: `${large ? 2 : 1}px solid ${T.accent}`, boxShadow: large ? `0 0 32px ${T.accent}30` : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: large ? 10 : 4, left: large ? 10 : 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: valueFontSize, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize, color, lineHeight: 1 }}>{suit}</div>
      <div style={{ position: "absolute", bottom: large ? 10 : 4, right: large ? 10 : 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: valueFontSize, color, lineHeight: 1, transform: "rotate(180deg)" }}>{value}</div>
    </div>
  );
}

// ─── Shared page header ───────────────────────────────────────────────────────
function PageHeader({ badge }: { badge: string }) {
  const { mode, colors: T, toggle } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48, gap: 16, flexWrap: "wrap" as const }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 22, height: 22, transform: "rotate(45deg)", border: `1.5px solid ${T.accent}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, background: T.accent, borderRadius: 2 }} />
        </div>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, letterSpacing: "0.01em" }}>The Holding</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "5px 11px", borderRadius: 999, background: `rgba(${T.successRgb},0.1)`, border: `1px solid ${T.successBorder}`, color: T.success }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.success, display: "inline-block" }} />
          {badge}
        </div>
        <button
          onClick={toggle}
          aria-label={mode === "night" ? "Switch to day mode" : "Switch to night mode"}
          title={mode === "night" ? "Switch to day mode" : "Switch to night mode"}
          style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.panel, color: T.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, padding: 0 }}
        >
          {mode === "night" ? "☀" : "☾"}
        </button>
      </div>
    </div>
  );
}

// ─── Card look section (front + back images) ──────────────────────────────────
function CardLookSection() {
  const { colors: T } = useTheme();
  const [frontErr, setFrontErr] = useState(false);
  const [backErr, setBackErr] = useState(false);

  function CardImagePlaceholder({ label }: { label: string }) {
    return (
      <div style={{ width: "100%", aspectRatio: "5/7", borderRadius: 14, border: `1px dashed ${T.border}`, background: T.bg, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.surfaceInactive}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="2" stroke={T.textFaintest} strokeWidth="1.2" />
            <circle cx="5.5" cy="7" r="1.5" stroke={T.textFaintest} strokeWidth="1.2" />
            <path d="M1 11l4-3 3 2.5 3-4 4 4.5" stroke={T.textFaintest} strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFaintest, textAlign: "center" as const, letterSpacing: "0.1em" }}>
          {label}<br />coming soon
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "24px 26px", marginBottom: 20 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 6 }}>Card design</div>
      <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: "0 0 5px" }}>What the card looks like</h3>
      <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 22px", lineHeight: 1.6 }}>
        The front holds your artwork in the 1.8 × 2.8 in area. The back is a shared design by The Holding — the same on every card in the deck.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: T.textFaint, marginBottom: 10, textTransform: "uppercase" as const }}>Front — your artwork</div>
          {!frontErr ? (
            <img
              src="/card-front.png"
              alt="Card front"
              onError={() => setFrontErr(true)}
              style={{ width: "100%", borderRadius: 14, display: "block", border: `1px solid ${T.border}` }}
            />
          ) : (
            <CardImagePlaceholder label="CARD FRONT" />
          )}
        </div>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: T.textFaint, marginBottom: 10, textTransform: "uppercase" as const }}>Back — shared template</div>
          {!backErr ? (
            <img
              src="/card-back.png"
              alt="Card back"
              onError={() => setBackErr(true)}
              style={{ width: "100%", borderRadius: 14, display: "block", border: `1px solid ${T.border}` }}
            />
          ) : (
            <CardImagePlaceholder label="CARD BACK" />
          )}
        </div>
      </div>
      <div style={{ marginTop: 16, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFainter, lineHeight: 1.6 }}>
        Card dimensions: 2.5 × 3.5 in (750 × 1050 px at 300 dpi) — standard poker size. Artwork area: 1.8 × 2.8 in centered, with 0.35 in frame margin on all sides.
      </div>
    </div>
  );
}

// ─── Artwork canvas preview (step 2) ─────────────────────────────────────────
function ArtworkPreviewSection() {
  const { colors: T } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateImg = useRef<HTMLImageElement | null>(null);
  const artworkImg = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [handle, setHandle] = useState("");
  const handleRef = useRef(handle);
  handleRef.current = handle;
  const TRef = useRef(T);
  TRef.current = T;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const theme = TRef.current;

    ctx.clearRect(0, 0, CW, CH);

    const hasTemplate = !!templateImg.current;

    // Base layer: the real card frame (opaque white background + printed corners),
    // drawn first so the artwork can be layered on top of it within the art area.
    if (hasTemplate) {
      ctx.drawImage(templateImg.current!, 0, 0, CW, CH);
    } else {
      ctx.fillStyle = theme.controlBg;
      ctx.fillRect(0, 0, CW, CH);
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, CW - 4, CH - 4);
      ctx.strokeStyle = theme.textFaintest;
      ctx.lineWidth = 2;
      ctx.strokeRect(ART_X, ART_Y, ART_W, ART_H);
      const corners: [number, number][] = [[18, 18], [CW - 18, 18], [CW - 18, CH - 18], [18, CH - 18]];
      ctx.fillStyle = theme.accent;
      for (const [cx, cy] of corners) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-7, -7, 14, 14);
        ctx.restore();
      }
    }

    if (artworkImg.current) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ART_X, ART_Y, ART_W, ART_H);
      ctx.clip();
      const img = artworkImg.current;
      const scale = Math.max(ART_W / img.naturalWidth, ART_H / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, ART_X + (ART_W - sw) / 2, ART_Y + (ART_H - sh) / 2, sw, sh);
      ctx.restore();
    } else {
      // The card face itself is always a light, print-ready white card —
      // this placeholder mirrors that regardless of the page's day/night mode.
      const placeholderInk = hasTemplate ? "#b0a996" : theme.textFaintest;
      const placeholderBg = hasTemplate ? "#f3efe6" : theme.controlBg;
      ctx.fillStyle = placeholderBg;
      ctx.fillRect(ART_X, ART_Y, ART_W, ART_H);
      ctx.strokeStyle = placeholderInk;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(ART_X + 1, ART_Y + 1, ART_W - 2, ART_H - 2);
      ctx.setLineDash([]);
      ctx.fillStyle = placeholderInk;
      ctx.font = `22px 'IBM Plex Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Your artwork here", CW / 2, CH / 2);
    }

    const currentHandle = handleRef.current.trim();
    const displayHandle = currentHandle || "@yourhandle";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 34px 'Hanken Grotesk', sans-serif`;
    ctx.fillStyle = currentHandle ? "#1f1b18" : "#b8b0a3";
    ctx.fillText(displayHandle, HANDLE_X, HANDLE_BASELINE);
  }, []);

  useLayoutEffect(() => {
    drawCanvas();
    const img = new Image();
    img.onload = () => { templateImg.current = img; drawCanvas(); };
    img.onerror = () => { templateImg.current = null; };
    img.src = "/card-front-template.png";
  }, [drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [handle, T, drawCanvas]);

  useEffect(() => {
    if (!artworkUrl) { artworkImg.current = null; drawCanvas(); return; }
    const img = new Image();
    img.onload = () => { artworkImg.current = img; drawCanvas(); };
    img.src = artworkUrl;
  }, [artworkUrl, drawCanvas]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setArtworkUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "54hands-card-preview.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 26px", marginTop: 24 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 6 }}>Template preview</div>
      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 5px" }}>Preview your artwork in the card</h2>
      <p style={{ color: T.textMuted, margin: "0 0 22px", fontSize: 13.5, lineHeight: 1.55, maxWidth: 500 }}>
        Upload your artwork to see how it sits in the card template. Your artwork fills the 1.8 × 2.8 in center area — the frame is designed by The Holding.
      </p>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" as const }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: T.textFaint, textAlign: "center" as const, marginBottom: 4 }}>← 2.5 in / 750 px →</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: T.textFaint, writingMode: "vertical-rl" as const, transform: "rotate(180deg)", letterSpacing: "0.1em" }}>← 3.5 in / 1050 px →</div>
            <div>
              <canvas ref={canvasRef} width={CW} height={CH} style={{ width: CARD_DISPLAY_W, height: CARD_DISPLAY_H, borderRadius: 8, display: "block", background: T.controlBg, border: `1px solid ${T.border}` }} />
              {artworkUrl && (
                <button onClick={handleDownload} style={{ marginTop: 10, width: "100%", height: 34, borderRadius: 8, border: `1px solid ${T.inputBorder}`, background: "transparent", color: T.textSecondary, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Download preview PNG
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ border: `1.5px dashed ${dragging ? T.accent : T.inputBorder}`, borderRadius: 12, padding: "28px 20px", textAlign: "center" as const, cursor: "pointer", background: dragging ? `rgba(${T.accentRgb},0.05)` : "transparent", transition: "border-color 0.15s, background 0.15s", marginBottom: 20 }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.inputBorder}`, background: T.controlBg, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" />
                <path d="M8 2v8M5 5l3-3 3 3" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13.5, color: T.textSecondary, marginBottom: 5 }}>{artworkUrl ? "Click or drag to replace" : "Click or drag artwork here"}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFaint }}>PNG or JPG — 750 × 1050 px at 300 dpi (standard playing card)</div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: T.textFaint, textTransform: "uppercase" as const, marginBottom: 8 }}>
              Your name / handle
            </label>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="@yourhandle"
              style={{ width: "100%", height: 38, borderRadius: 8, border: `1px solid ${T.inputBorder}`, background: T.controlBg, color: T.textPrimary, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13.5, padding: "0 12px", boxSizing: "border-box" as const }}
            />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFaint, marginTop: 6 }}>Printed in the bottom-left margin, as shown on the reference card front.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const }}>
            {[
              { label: "Card size", value: "750 × 1050 px", note: "2.5 × 3.5 in at 300 dpi — standard playing card" },
              { label: "Artwork area", value: "540 × 840 px", note: "1.8 × 2.8 in — 105 px (0.35 in) margin each side" },
              { label: "Template", value: "Provided", note: "card-front-template.png — the real printable frame" },
              { label: "Resolution", value: "300 dpi", note: "Print-ready — download to verify" },
            ].map(({ label, value, note }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.divider}`, padding: "10px 0" }}>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textLabel, letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: T.textFaintest, marginTop: 2 }}>{note}</div>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: T.accent }}>{value}</div>
              </div>
            ))}
          </div>
          {artworkUrl && (
            <div style={{ marginTop: 14, padding: "11px 14px", borderRadius: 9, background: `rgba(${T.successRgb},0.08)`, border: `1px solid ${T.successBorder}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.success }}>
              Looks good? Submit via the Google Form when ready.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Result panel (step 2) ────────────────────────────────────────────────────
function ResultPanel({ result, formUrl, onReset }: { result: RegistrationResult; formUrl: string; onReset: () => void }) {
  const { colors: T } = useTheme();
  if (result.status === "conflict") {
    return (
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 26px", marginBottom: 24 }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.conflict, margin: "0 0 14px" }}>A conflict occurred — two people submitted at the same time. Please try again.</p>
        <button onClick={onReset} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: `1px solid ${T.inputBorder}`, background: "transparent", color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>Try again</button>
      </div>
    );
  }

  const card = (result.status === "success" || result.status === "already_registered") ? result.card : null;
  const isNew = result.status === "success";
  const parsed = card ? (() => {
    if (card === "Joker Red") return { value: "Joker", suit: "♥" };
    if (card === "Joker Black") return { value: "Joker", suit: "♠" };
    return { value: card.slice(0, -1), suit: card.slice(-1) };
  })() : null;

  return (
    <div style={{ background: T.panel, border: `1px solid ${isNew ? T.accent + "60" : T.border}`, borderRadius: 16, padding: "28px 26px", marginBottom: 24, boxShadow: isNew ? `0 0 40px ${T.accent}10` : "none" }}>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {card && <CardFace cardKey={card} large />}
        <div style={{ flex: 1 }}>
          {isNew ? (
            <>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: T.success, textTransform: "uppercase" as const, marginBottom: 10 }}>Card assigned ✓</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 400, margin: "0 0 6px" }}>
                You got the <em style={{ color: T.accent }}>{parsed?.value} {parsed?.suit}</em>
              </h2>
              <p style={{ color: T.textBody, margin: "0 0 20px", fontSize: 14, lineHeight: 1.55 }}>
                Your card is locked in. Create artwork sized 1.8 × 2.8 in and submit it using the form below by <strong style={{ color: T.textSecondary }}>{ARTWORK_DEADLINE}</strong>.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: T.accent, textTransform: "uppercase" as const, marginBottom: 10 }}>Already registered</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 400, margin: "0 0 6px" }}>
                Your card is the <em style={{ color: T.accent }}>{parsed?.value} {parsed?.suit}</em>
              </h2>
              <p style={{ color: T.textBody, margin: "0 0 20px", fontSize: 14, lineHeight: 1.55 }}>
                You&apos;re already registered. Submit your artwork using the form below by <strong style={{ color: T.textSecondary }}>{ARTWORK_DEADLINE}</strong>.
              </p>
            </>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            <a href={formUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 22px", borderRadius: 10, background: T.accent, color: T.accentOnAccent, fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "'Hanken Grotesk', sans-serif" }}>
              Submit your artwork →
            </a>
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 22px", borderRadius: 10, background: "transparent", border: `1px solid ${T.whatsapp}60`, color: T.whatsapp, fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "'Hanken Grotesk', sans-serif" }}>
              Join the WhatsApp group →
            </a>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.textFaint, marginTop: 12 }}>
            Get updates on production, milestones, and deadlines from the other 53 artists.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Volume 2 panel (step 2, when all 54 cards are claimed) ──────────────────
function VolumeTwoPanel({ nextProject }: { nextProject: Project | null }) {
  const { colors: T } = useTheme();
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: "32px 26px", marginBottom: 24, textAlign: "center" as const }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 14 }}>All 54 cards claimed</div>
      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 400, margin: "0 0 10px" }}>Volume 2 is coming</h2>
      <p style={{ color: T.textBody, margin: "0 auto 24px", fontSize: 14, lineHeight: 1.65, maxWidth: 420 }}>
        {nextProject?.description ?? "54 more cards, 54 more artists. Registration for Volume 2 will open soon."}
      </p>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.textFaint }}>
        Follow <span style={{ color: T.accent }}>The Holding</span> for updates on Volume 2 registration.
      </div>
    </div>
  );
}

// ─── Reusable bullet list ─────────────────────────────────────────────────────
function BulletList({ items }: { items: { head: string; body: string }[] }) {
  const { colors: T } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
      {items.map(({ head, body }) => (
        <div key={head} style={{ display: "flex", gap: 10 }}>
          <div style={{ color: T.textFaintest, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, flexShrink: 0, marginTop: 1 }}>—</div>
          <div style={{ fontSize: 13.5, color: T.textBody, lineHeight: 1.65 }}>
            <span style={{ color: T.textSecondary, fontWeight: 600 }}>{head}</span>{" "}{body}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section heading helper ───────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  const { colors: T } = useTheme();
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: T.accent, textTransform: "uppercase" as const, marginBottom: 12 }}>
      {label}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FiftyFourHandsClient({ project, nextProject, initialRegistrations, formUrl }: Props) {
  const [mode, setMode] = useState<ThemeMode>("night");
  const [step, setStep] = useState<1 | 2>(1);
  const [agreed, setAgreed] = useState(false);

  // Step 2 state
  const [registrations, setRegistrations] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const r of initialRegistrations) map.set(r.card_key, r.name);
    return map;
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [highlightCard, setHighlightCard] = useState<string | null>(null);

  const takenCount = registrations.size;
  const totalSlots = project.total_slots ?? 54;
  const isFull = takenCount >= totalSlots;
  const MILESTONE = 250;

  const T = THEMES[mode];

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "day" || saved === "night") setMode(saved);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(prev => {
      const next: ThemeMode = prev === "night" ? "day" : "night";
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (highlightCard) {
      const el = document.getElementById(`card-${highlightCard}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightCard]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError(null);
    if (!name.trim()) { setFieldError("Please enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setFieldError("Please enter a valid email."); return; }
    setSubmitting(true);
    const res = await fetch("/api/54-hands/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), projectId: project.id }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setRegistrations(prev => new Map(prev).set(data.card, name.trim()));
      setResult({ status: "success", card: data.card });
      setHighlightCard(data.card);
    } else if (data.error === "already_registered") {
      setResult({ status: "already_registered", card: data.card });
      setHighlightCard(data.card);
    } else if (data.error === "all_taken") {
      setResult({ status: "full" });
    } else if (data.error === "conflict") {
      setResult({ status: "conflict" });
    } else {
      setFieldError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <ThemeContext.Provider value={{ mode, colors: T, toggle: toggleTheme }}>
    <div style={{ minHeight: "100vh", background: T.bg, color: T.textPrimary, fontFamily: "'Hanken Grotesk', system-ui, sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 72px" }}>

        <PageHeader badge={step === 1 ? "Open for submissions" : "Step 2 — Card selection"} />

        {/* ── STEP INDICATOR ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>
          {[
            { n: 1, label: "Project details" },
            { n: 2, label: "Claim your card" },
          ].map(({ n, label }, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: step === n ? 1 : 0.4 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${step === n ? T.accent : T.textFaintest}`, background: step > n ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: step > n ? T.accentOnAccent : (step === n ? T.accent : T.textFaintest), flexShrink: 0 }}>
                  {step > n ? "✓" : n}
                </div>
                <span style={{ color: step === n ? T.textSecondary : T.textFainter, letterSpacing: "0.1em" }}>{label.toUpperCase()}</span>
              </div>
              {i === 0 && <div style={{ width: 40, height: 1, background: step > 1 ? T.accent : T.surfaceInactive, margin: "0 12px", flexShrink: 0 }} />}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 — PROJECT DETAILS
        ══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            {/* Title */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: T.textFaint, textTransform: "uppercase" as const, marginBottom: 10 }}>The Holding · Project 001</div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 52, fontWeight: 400, margin: "0 0 16px", lineHeight: 1 }}>54 Hands</h1>
              <p style={{ fontSize: 15.5, color: T.textBody, lineHeight: 1.65, margin: "0 0 20px", maxWidth: 580 }}>
                A playing card deck featuring original artwork from 54 artists — one card per artist, one template by The Holding. Every participating artist receives an equal share of sales revenue.
              </p>
              <div style={{ display: "flex", gap: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.textLabel, flexWrap: "wrap" as const }}>
                {[
                  { label: "Cards", value: `${takenCount} / ${totalSlots} claimed` },
                  { label: "Revenue split", value: "Equal per artist" },
                  { label: "Milestone", value: `${MILESTONE} decks → free deck` },
                  { label: "Card size", value: "2.5 × 3.5 in" },
                  { label: "Artwork deadline", value: ARTWORK_DEADLINE },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span style={{ color: T.textFaintest }}>{label}: </span>
                    <span style={{ color: T.textSecondary }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card look */}
            <CardLookSection />

            {/* How it works */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "22px 26px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 18 }}>How it works</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                {[
                  { step: "01", title: "Claim a card", body: "Register with your name and email. You receive one randomly assigned card from the 54-card deck." },
                  { step: "02", title: "Create artwork", body: "Make original artwork sized 1.8 × 2.8 in, centered in the 2.5 × 3.5 in card. The Holding provides the template." },
                  { step: "03", title: "Submit via form", body: `Upload through the Google Form by ${ARTWORK_DEADLINE}. The Holding handles production, printing, and distribution.` },
                  { step: "04", title: "Earn & own", body: "Receive your equal share of every sale. At 250 decks, every artist gets a free copy of the deck." },
                ].map(({ step, title, body }) => (
                  <div key={step}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, color: T.ghostNumber, lineHeight: 1, marginBottom: 12 }}>{step}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.65 }}>{body}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue + Milestone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "22px 22px" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 16 }}>Revenue model</div>
                <div style={{ marginBottom: 18 }}>
                  {[
                    { label: "Artists (net revenue, equal split)", pct: "100%", color: T.accent, bar: T.accent },
                  ].map(({ label, pct, color, bar }) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color }}>{label}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color }}>{pct}</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 999, background: T.divider, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "100%", background: bar, borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: T.textBody, lineHeight: 1.65, paddingTop: 14, borderTop: `1px solid ${T.divider}` }}>
                  The Holding deducts actual production cost from sales revenue — no fixed percentage, no commons treasury. What's left (the net) is divided equally among all {totalSlots} participants, no hierarchy, no tiers.
                </div>
                <div style={{ marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFainter, padding: "8px 10px", borderRadius: 7, background: T.sunken }}>
                  Your share per deck sold = (deck price − production cost) ÷ {totalSlots}
                </div>
              </div>

              <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "22px 22px", display: "flex", flexDirection: "column" as const }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 16 }}>Milestone</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 56, color: T.accent, lineHeight: 1 }}>{MILESTONE}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.textLabel, lineHeight: 1.4 }}>decks<br />sold</div>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 10 }}>Every artist gets a free complete deck</div>
                <div style={{ fontSize: 13, color: T.textBody, lineHeight: 1.65, flex: 1 }}>
                  Once 54 Hands reaches {MILESTONE} copies sold, each of the {totalSlots} participating artists receives a complimentary full deck — every card, all 54 artists' work, printed and shipped at no cost.
                </div>
                <div style={{ marginTop: 16, height: 6, borderRadius: 999, background: T.divider, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "0%", background: T.accent, borderRadius: 999 }} />
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFainter, marginTop: 6 }}>0 / {MILESTONE} sold — milestone in progress</div>
              </div>
            </div>

            {/* Production costs */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "24px 26px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 6 }}>Production costs</div>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: "0 0 5px" }}>How production is funded</h3>
              <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 20px", lineHeight: 1.65 }}>
                The Holding deducts actual production cost from sales revenue before any payout — there is no commons treasury and no fixed percentage taken. Artists are not charged anything upfront, and everything left after covering cost is split equally among the participating artists. Exact figures will be confirmed and shared with all participants before production begins.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { item: "Card printing", note: "Per deck, full-colour both sides", value: "TBC" },
                  { item: "Tuck box & packaging", note: "Custom-designed by The Holding", value: "TBC" },
                  { item: "Quality control", note: "Sample review before full print run", value: "TBC" },
                  { item: "Shipping — milestone decks", note: "Free decks to all artists at 250 sold", value: "TBC" },
                  { item: "Platform & fulfilment", note: "Sales processing and order handling", value: "TBC" },
                  { item: "Infrastructure", note: "Website, tools, and operations", value: "TBC" },
                ].map(({ item, note, value }) => (
                  <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, background: T.sunken, border: `1px solid ${T.divider}` }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.textSecondary, fontWeight: 500, marginBottom: 3 }}>{item}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFainter }}>{note}</div>
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.textFaint, flexShrink: 0, marginLeft: 12 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 9, background: `rgba(${T.accentRgb},0.06)`, border: `1px solid ${T.accent}25`, fontSize: 13, color: T.textBody, lineHeight: 1.65 }}>
                A full cost breakdown will be shared with all participants before the production agreement is signed. No money changes hands until the numbers are transparent and agreed upon.
              </div>
            </div>

            {/* Deck specs */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "22px 26px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 18 }}>Deck specifications</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
                {[
                  { label: "Total cards", value: String(totalSlots), note: "4 suits × 13 + 2 jokers" },
                  { label: "Card size", value: "2.5 × 3.5 in", note: "750 × 1050 px at 300 dpi" },
                  { label: "Artwork area", value: "1.8 × 2.8 in", note: "540 × 840 px — 0.35 in margin each side" },
                  { label: "Artists", value: `${totalSlots} unique`, note: "One card per artist" },
                  { label: "Template", value: "By The Holding", note: "Consistent frame across all 54 cards" },
                  { label: "Submission", value: "Google Form", note: "High-resolution digital file" },
                ].map(({ label, value, note }, i) => (
                  <div key={label} style={{ padding: "16px 0", borderBottom: i < 3 ? `1px solid ${T.divider}` : "none", paddingRight: (i + 1) % 3 !== 0 ? 24 : 0, borderRight: (i + 1) % 3 !== 0 ? `1px solid ${T.divider}` : "none", paddingLeft: i % 3 !== 0 ? 24 : 0 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: T.textFaint, textTransform: "uppercase" as const, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: T.textSecondary, marginBottom: 4 }}>{value}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFaintest }}>{note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Copyright & licensing */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "28px 30px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 6 }}>54 Hands: The First Gathering</div>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 6px" }}>Copyright & licensing</h3>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.textFaint, margin: "0 0 28px", lineHeight: 1.5 }}>
                What you need to know as an artist — written in plain language intentionally. No legalese.
              </p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
                <div>
                  <SectionLabel label="Your copyright" />
                  <BulletList items={[
                    { head: "Who owns the work:", body: "You do. Always. Participating in 54 Hands does not transfer copyright to Ethra, The Holding, or anyone else." },
                    { head: "What you keep:", body: "Full rights to sell, exhibit, reproduce, or use your artwork in any other context — before, during, and after the deck exists." },
                    { head: "What doesn't change:", body: "Your name stays attached to your work. You will always be credited as the creator of your card." },
                  ]} />
                </div>
                <div style={{ height: 1, background: T.divider }} />
                <div>
                  <SectionLabel label="How your artwork will be used" />
                  <BulletList items={[
                    { head: "Printed on:", body: "One card in the 54 Hands physical deck. Your artwork fills the card face." },
                    { head: "Promotional use:", body: "Your card may appear in social media posts, the project website, press materials, and documentation about 54 Hands and The Holding. Always with your credit." },
                    { head: "Future volumes:", body: "Your artwork will not be used in any future project without a separate agreement." },
                    { head: "Not used for:", body: "Merchandise, licensing to third parties, commercial use outside this project, or any purpose not listed above." },
                  ]} />
                </div>
                <div style={{ height: 1, background: T.divider }} />
                <div>
                  <SectionLabel label="The license you're granting" />
                  <p style={{ fontSize: 13.5, color: T.textBody, lineHeight: 1.7, margin: "0 0 14px" }}>
                    By submitting your artwork you&apos;re granting Ethra / The Holding a <strong style={{ color: T.textSecondary }}>limited, non-exclusive, royalty-free license</strong> to use your artwork solely for the purposes described above.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {[
                      { term: "Non-exclusive", body: "You can still use your artwork anywhere else." },
                      { term: "Limited", body: "We can only use it for 54 Hands." },
                      { term: "Royalty-free", body: "No separate licensing fee — your revenue share is your compensation." },
                    ].map(({ term, body }) => (
                      <div key={term} style={{ background: T.sunken, border: `1px solid ${T.divider}`, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.accent, marginBottom: 6 }}>{term}</div>
                        <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.6 }}>{body}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ height: 1, background: T.divider }} />
                <div>
                  <SectionLabel label="What you're confirming when you submit" />
                  <BulletList items={[
                    { head: "Ownership:", body: "The artwork is your original work and you have the right to license it." },
                    { head: "No conflicts:", body: "The artwork is not under an exclusive agreement with a gallery, label, or platform that prevents this use." },
                    { head: "No third-party IP:", body: "The artwork does not contain copyrighted characters, logos, or material belonging to someone else." },
                  ]} />
                </div>
                <div style={{ background: `rgba(${T.accentRgb},0.06)`, border: `1px solid ${T.accent}25`, borderRadius: 10, padding: "16px 18px", fontSize: 13.5, color: T.textBody, lineHeight: 1.7 }}>
                  If anything here is unclear — an exclusive gallery agreement, collaborative work, or any other specific situation — DM me directly before submitting. We&apos;ll figure it out.
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textFainter, lineHeight: 1.7, borderTop: `1px solid ${T.divider}`, paddingTop: 16 }}>
                  This is not a formal legal contract. It is a plain-language statement of intent. A simple participation agreement will be shared before production begins for everyone to sign.
                </div>
              </div>
            </div>

            {/* Next steps — artist responsibilities */}
            <div style={{ border: `1px solid ${T.accent}30`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ background: `linear-gradient(135deg, rgba(${T.accentRgb},0.12) 0%, rgba(${T.accentRgb},0.04) 100%)`, borderBottom: `1px solid ${T.accent}20`, padding: "22px 26px" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: T.accent + "aa", textTransform: "uppercase" as const, marginBottom: 8 }}>For participating artists</div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 400, margin: "0 0 10px", lineHeight: 1.1 }}>Your card is your campaign.</h3>
                <p style={{ fontSize: 14.5, color: T.textBody, margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
                  54 Hands only works if 54 people talk about it. The Holding handles production — but the reach comes from you. Every artist who shares the project is doing as much as the one who makes the best card.
                </p>
              </div>
              <div style={{ background: T.panel, padding: "24px 26px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                  {[
                    { title: "Show your card publicly", body: "Post it on Instagram, Twitter, Behance — wherever your audience is. Let people see what their money goes towards." },
                    { title: "Tell the story behind it", body: "Why did you make the choices you made? A post about process travels further than a product announcement." },
                    { title: "Ask people to buy", body: "Tell your followers directly that buying a deck supports you and 53 other artists at once. Don't be shy about it." },
                    { title: "Tag the other artists", body: "Cross-promote with the other 53 artists in the deck. Their audience becomes yours. Every share multiplies." },
                  ].map(({ title, body }) => (
                    <div key={title} style={{ display: "flex", gap: 14, padding: "16px 18px", borderRadius: 10, background: T.sunken, border: `1px solid ${T.divider}` }}>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, color: T.accent, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>→</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</div>
                        <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.65 }}>{body}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: `1px solid ${T.divider}`, paddingTop: 20, display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ flex: 1, fontSize: 14.5, color: T.textSecondary, lineHeight: 1.7 }}>
                    At {MILESTONE} decks, everyone gets their own free copy. That milestone is reachable — but only if the project actually spreads. You have a card in this deck. That makes it yours to sell.
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "center" as const, padding: "14px 20px", borderRadius: 12, background: T.sunken, border: `1px solid ${T.accent}25` }}>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, color: T.accent, lineHeight: 1 }}>54</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: T.textFaint, marginTop: 4, letterSpacing: "0.1em" }}>ARTISTS<br />ONE DECK</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI disclosure */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 32 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.accent, letterSpacing: "0.14em", textTransform: "uppercase" as const, flexShrink: 0, paddingTop: 2 }}>AI disclosure</div>
              <div style={{ width: 1, background: T.border, alignSelf: "stretch", flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: T.textBody, lineHeight: 1.7 }}>
                The planning of this project and website were made with the assistance of AI tools. The concept, vision, and creative direction behind 54 Hands and The Holding are entirely human.
              </div>
            </div>

            {/* Checkbox + continue */}
            <div style={{ background: T.panel, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: "28px 30px" }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: "0 0 6px" }}>Ready to participate?</h3>
              <p style={{ fontSize: 13.5, color: T.textMuted, margin: "0 0 22px", lineHeight: 1.55 }}>
                Confirm you've read and understood the details above before claiming your card.
              </p>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer", marginBottom: 24 }}>
                <div
                  onClick={() => setAgreed(a => !a)}
                  style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${agreed ? T.accent : T.textFaintest}`, background: agreed ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s", cursor: "pointer" }}
                >
                  {agreed && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4l3.5 3.5L10 1" stroke={T.accentOnAccent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 14, color: agreed ? T.textSecondary : T.textMuted, lineHeight: 1.6, transition: "color 0.15s", userSelect: "none" as const }}>
                  I have read and understood the project details — the revenue split, copyright terms, production cost structure, and what&apos;s expected of me as a participating artist. I&apos;m ready to claim my card.
                </span>
              </label>
              <button
                disabled={!agreed}
                onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ height: 50, padding: "0 32px", borderRadius: 12, border: "none", background: agreed ? T.accent : T.surfaceInactive, color: agreed ? T.accentOnAccent : T.textFainter, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 15, fontWeight: 700, cursor: agreed ? "pointer" : "not-allowed", transition: "all 0.2s" }}
              >
                Continue to card selection →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2 — CARD SELECTION
        ══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            {/* Back + title */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 40, fontWeight: 400, margin: "0 0 6px", lineHeight: 1 }}>Claim your card</h1>
                <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>
                  {takenCount} of {totalSlots} cards claimed — {totalSlots - takenCount} remaining
                </p>
              </div>
              <button
                onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ height: 38, padding: "0 16px", borderRadius: 9, border: `1px solid ${T.inputBorder}`, background: "transparent", color: T.textSecondary, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                ← Back to details
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: T.divider, borderRadius: 999, marginBottom: 24, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(takenCount / totalSlots) * 100}%`, background: T.accent, borderRadius: 999, transition: "width 0.4s ease" }} />
            </div>

            {/* Card grid */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 24 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: T.textLabel, textTransform: "uppercase" as const, marginBottom: 16 }}>
                Card grid — hover to see who claimed each card
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {SUITS.map((suit) => (
                  <div key={suit} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 22, fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: suitColor(suit, T), flexShrink: 0, textAlign: "center" as const, lineHeight: 1 }}>{suit}</span>
                    <div style={{ flex: 1, display: "flex", gap: 4 }}>
                      {VALUES.map((value) => {
                        const key = `${value}${suit}`;
                        const claimant = registrations.get(key);
                        const isHighlighted = highlightCard === key;
                        return (
                          <div key={key} id={`card-${key}`} title={claimant ?? "Available"} style={{ flex: 1, aspectRatio: "1/1.4", borderRadius: 5, border: isHighlighted ? `1px solid ${T.accent}` : claimant ? `1px solid ${T.ghostNumber}` : `1px solid ${T.ghostBorder}`, background: isHighlighted ? `rgba(${T.accentRgb},0.14)` : claimant ? T.sunken : `rgba(${T.accentRgb},0.03)`, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 1, minWidth: 0, transition: "border-color 0.15s", boxShadow: isHighlighted ? `0 0 12px ${T.accent}20` : "none" }}>
                            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: isHighlighted ? suitColor(suit, T) : claimant ? T.textFaintest : suitColor(suit, T), lineHeight: 1, opacity: claimant && !isHighlighted ? 0.5 : 1 }}>{value}</div>
                            {claimant ? (
                              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 7, color: isHighlighted ? T.accent : T.textFaintest, lineHeight: 1, overflow: "hidden", maxWidth: "90%", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{claimant.split(" ")[0]}</div>
                            ) : (
                              <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.dotMuted }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Jokers */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ width: 22, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.textFainter, flexShrink: 0, textAlign: "center" as const }}>★</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["Joker Red", "Joker Black"] as const).map((joker) => {
                      const claimant = registrations.get(joker);
                      const isHighlighted = highlightCard === joker;
                      const isRed = joker === "Joker Red";
                      return (
                        <div key={joker} id={`card-${joker}`} title={claimant ?? joker} style={{ width: 46, aspectRatio: "1/1.4", borderRadius: 5, border: isHighlighted ? `1px solid ${T.accent}` : claimant ? `1px solid ${T.ghostNumber}` : `1px solid ${T.ghostBorder}`, background: isHighlighted ? `rgba(${T.accentRgb},0.14)` : claimant ? T.sunken : `rgba(${T.accentRgb},0.03)`, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 1, boxShadow: isHighlighted ? `0 0 12px ${T.accent}20` : "none" }}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: claimant && !isHighlighted ? T.textFaintest : isRed ? T.redSuit : T.textSecondary, lineHeight: 1 }}>{isRed ? "J♥" : "J♠"}</div>
                          {claimant && <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 7, color: isHighlighted ? T.accent : T.textFaintest, lineHeight: 1 }}>{claimant.split(" ")[0]}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 14, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: T.textLabel }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: T.sunken, border: `1px solid ${T.ghostNumber}`, display: "inline-block" }} />Claimed</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(${T.accentRgb},0.03)`, border: `1px solid ${T.ghostBorder}`, display: "inline-block" }} />Available</span>
                <span style={{ marginLeft: "auto" }}>{takenCount} / {totalSlots} claimed</span>
              </div>
            </div>

            {/* Registration or result or volume 2 */}
            {!isFull ? (
              result ? (
                <ResultPanel result={result} formUrl={formUrl} onReset={() => { setResult(null); setHighlightCard(null); }} />
              ) : (
                <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 26px", marginBottom: 24 }}>
                  <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 6px" }}>Claim your card</h2>
                  <p style={{ color: T.textMuted, margin: "0 0 22px", fontSize: 13.5, lineHeight: 1.55 }}>
                    Enter your name and email — you&apos;ll be randomly assigned one of the {totalSlots - takenCount} remaining cards. Your assignment is permanent once confirmed.
                  </p>
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {[
                        { label: "Your name", type: "text", value: name, onChange: setName, placeholder: "Artist name", autoComplete: "name" },
                        { label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "you@example.com", autoComplete: "email" },
                      ].map(({ label, type, value, onChange, placeholder, autoComplete }) => (
                        <div key={label}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: T.textMuted, textTransform: "uppercase" as const, marginBottom: 7 }}>{label}</div>
                          <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete}
                            style={{ width: "100%", boxSizing: "border-box" as const, background: T.bg, border: `1px solid ${T.inputBorder}`, borderRadius: 10, color: T.textPrimary, padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }}
                            onFocus={e => e.currentTarget.style.borderColor = T.accent}
                            onBlur={e => e.currentTarget.style.borderColor = T.inputBorder}
                          />
                        </div>
                      ))}
                    </div>
                    {fieldError && (
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.error, background: `rgba(${T.errorRgb},0.08)`, border: `1px solid rgba(${T.errorRgb},0.18)`, borderRadius: 8, padding: "10px 12px" }}>{fieldError}</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <button type="submit" disabled={submitting} style={{ height: 46, padding: "0 28px", borderRadius: 11, border: "none", background: submitting ? T.textFaint : T.accent, color: T.accentOnAccent, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>
                        {submitting ? "Assigning…" : "Claim my card →"}
                      </button>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: T.textFaint, lineHeight: 1.5 }}>Assigned randomly.<br />Locked once confirmed.</span>
                    </div>
                  </form>
                </div>
              )
            ) : (
              <VolumeTwoPanel nextProject={nextProject} />
            )}

            {/* Submission info */}
            {!result && !isFull && (
              <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, margin: "0 0 5px" }}>Already have your card?</h2>
                    <p style={{ color: T.textMuted, margin: 0, fontSize: 13 }}>Submit your artwork using the Google Form below by {ARTWORK_DEADLINE}.</p>
                  </div>
                  <a href={formUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, height: 42, padding: "0 20px", borderRadius: 10, background: T.accent, color: T.accentOnAccent, fontWeight: 600, fontSize: 14, textDecoration: "none", fontFamily: "'Hanken Grotesk', sans-serif", display: "flex", alignItems: "center", whiteSpace: "nowrap" as const }}>
                    Submit artwork →
                  </a>
                </div>
              </div>
            )}

            {/* Artwork preview */}
            <ArtworkPreviewSection />
          </div>
        )}

      </div>
    </div>
    </ThemeContext.Provider>
  );
}
