"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import type { Project } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";
const BG = "#0e0d0b";
const BORDER = "#262119";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
type Suit = (typeof SUITS)[number];

const RED_SUITS = new Set(["♥", "♦"]);
function suitColor(suit: Suit | string): string {
  return RED_SUITS.has(suit) ? "#c97b6a" : "#c9bfaf";
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

function CardFace({ cardKey, large }: { cardKey: string; large?: boolean }) {
  const parsed = parseCard(cardKey);
  if (!parsed) return null;
  const { value, suit } = parsed;
  const color = suitColor(suit);
  const size = large ? 120 : 52;
  const fontSize = large ? 42 : 16;
  const valueFontSize = large ? 18 : 8;

  return (
    <div style={{
      width: size, height: Math.round(size * 1.4),
      borderRadius: large ? 12 : 6,
      background: PANEL,
      border: `${large ? 2 : 1}px solid ${ACCENT}`,
      boxShadow: large ? `0 0 32px ${ACCENT}30` : "none",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative", flexShrink: 0,
    }}>
      <div style={{ position: "absolute", top: large ? 10 : 4, left: large ? 10 : 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: valueFontSize, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize, color, lineHeight: 1 }}>{suit}</div>
      <div style={{ position: "absolute", bottom: large ? 10 : 4, right: large ? 10 : 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: valueFontSize, color, lineHeight: 1, transform: "rotate(180deg)" }}>{value}</div>
    </div>
  );
}

// Canvas = print-ready at 300 DPI (2.5 × 3.5 in standard playing card)
const CW = 750;   // 2.5 in × 300 dpi
const CH = 1050;  // 3.5 in × 300 dpi
const ART_W = 540; // 1.8 in × 300 dpi
const ART_H = 840; // 2.8 in × 300 dpi
const ART_X = 105; // (750 - 540) / 2 = 0.35 in margin each side
const ART_Y = 105; // (1050 - 840) / 2 = 0.35 in margin each side
// Displayed at 2.5× downscale — 300 × 420 CSS px preserves the 5:7 aspect ratio
const CARD_DISPLAY_W = 300;
const CARD_DISPLAY_H = 420;

function ArtworkPreviewSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateImg = useRef<HTMLImageElement | null>(null);
  const artworkImg = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CW, CH);

    // Card background
    ctx.fillStyle = "#1a1814";
    ctx.fillRect(0, 0, CW, CH);

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
      ctx.fillStyle = "#111009";
      ctx.fillRect(ART_X, ART_Y, ART_W, ART_H);
      ctx.strokeStyle = "#2e2820";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(ART_X + 1, ART_Y + 1, ART_W - 2, ART_H - 2);
      ctx.setLineDash([]);
      ctx.fillStyle = "#2e2820";
      ctx.font = `22px 'IBM Plex Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Your artwork here", CW / 2, CH / 2);
    }

    if (templateImg.current) {
      ctx.drawImage(templateImg.current, 0, 0, CW, CH);
    } else {
      // Placeholder frame — replaced once /template.png is provided in /public
      // Outer card border (flush with card edge, 4px stroke so visible inner edge is at 2px)
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, CW - 4, CH - 4);
      // Inner line marks the exact artwork boundary (1.8×2.8in area)
      ctx.strokeStyle = "#3a342b";
      ctx.lineWidth = 2;
      ctx.strokeRect(ART_X, ART_Y, ART_W, ART_H);
      // Corner diamonds at card corners
      const corners: [number, number][] = [[18, 18], [CW - 18, 18], [CW - 18, CH - 18], [18, CH - 18]];
      ctx.fillStyle = ACCENT;
      for (const [cx, cy] of corners) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-7, -7, 14, 14);
        ctx.restore();
      }
    }
  }, []);

  // useLayoutEffect draws synchronously before paint so the canvas is never blank
  useLayoutEffect(() => {
    drawCanvas();
    const img = new Image();
    img.onload = () => { templateImg.current = img; drawCanvas(); };
    img.onerror = () => { templateImg.current = null; };
    img.src = "/template.png";
  }, [drawCanvas]);

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
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "24px 26px", marginTop: 24, marginBottom: 0 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 6 }}>Template preview</div>
      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 5px" }}>Preview your artwork in the card</h2>
      <p style={{ color: "#847b6d", margin: "0 0 22px", fontSize: 13.5, lineHeight: 1.55, maxWidth: 500 }}>
        Upload your artwork to see how it sits in the card template. Your artwork fills the 1.8 × 2.8 in center area — the frame is designed by The Holding.
      </p>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" as const }}>
        {/* Canvas + labels */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#5f594f", textAlign: "center" as const, marginBottom: 4 }}>
            ← 2.5 in / 750 px →
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#5f594f", writingMode: "vertical-rl" as const, transform: "rotate(180deg)", letterSpacing: "0.1em" }}>
              ← 3.5 in / 1050 px →
            </div>
            <div>
              <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                style={{ width: CARD_DISPLAY_W, height: CARD_DISPLAY_H, borderRadius: 8, display: "block", background: "#1a1814" }}
              />
              {artworkUrl && (
                <button
                  onClick={handleDownload}
                  style={{ marginTop: 10, width: "100%", height: 34, borderRadius: 8, border: "1px solid #2c271f", background: "transparent", color: "#c9bfaf", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Download preview PNG
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload zone + specs */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ border: `1.5px dashed ${dragging ? ACCENT : "#2e2820"}`, borderRadius: 12, padding: "28px 20px", textAlign: "center" as const, cursor: "pointer", background: dragging ? "rgba(216,162,74,0.05)" : "transparent", transition: "border-color 0.15s, background 0.15s", marginBottom: 20 }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid #2e2820`, background: "#1a1814", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M8 2v8M5 5l3-3 3 3" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13.5, color: "#c9bfaf", marginBottom: 5 }}>
              {artworkUrl ? "Click or drag to replace" : "Click or drag artwork here"}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5f594f" }}>
              PNG or JPG — 750 × 1050 px at 300 dpi (standard playing card)
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
            {[
              { label: "Card size", value: "750 × 1050 px", note: "2.5 × 3.5 in at 300 dpi — standard playing card" },
              { label: "Artwork area", value: "540 × 840 px", note: "1.8 × 2.8 in — 105 px (0.35 in) margin each side" },
              { label: "Template", value: "Provided", note: "Drop template.png in /public" },
              { label: "Resolution", value: "300 dpi", note: "Print-ready — download to verify" },
            ].map(({ label, value, note }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e1b15", padding: "10px 0" }}>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6f6759", letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: "#3a342b", marginTop: 2 }}>{note}</div>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: ACCENT }}>{value}</div>
              </div>
            ))}
          </div>

          {artworkUrl && (
            <div style={{ marginTop: 14, padding: "11px 14px", borderRadius: 9, background: "rgba(147,168,119,0.08)", border: "1px solid #2e3a27", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#93a877" }}>
              Looks good? Submit via the Google Form when ready.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FiftyFourHandsClient({ project, nextProject, initialRegistrations, formUrl }: Props) {
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
  const totalSlots = project.total_slots;
  const isFull = takenCount >= totalSlots;

  // Scroll to the claimed card in the grid
  useEffect(() => {
    if (highlightCard) {
      const el = document.getElementById(`card-${highlightCard}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightCard]);

  async function handleSubmit(e: React.FormEvent) {
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

  const deadlineStr = project.end_date
    ? new Date(project.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#efe9dd", fontFamily: "'Hanken Grotesk', system-ui, sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 72px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 22, height: 22, transform: "rotate(45deg)", border: `1.5px solid ${ACCENT}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 7, height: 7, background: ACCENT, borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, letterSpacing: "0.01em" }}>The Holding</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "5px 11px", borderRadius: 999, background: "rgba(147,168,119,0.1)", border: "1px solid #3a4430", color: "#93a877" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#93a877", display: "inline-block" }} />
            Open for submissions
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#5f594f", textTransform: "uppercase" as const, marginBottom: 10 }}>
            The Holding · Project 001
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 52, fontWeight: 400, margin: "0 0 14px", lineHeight: 1 }}>54 Hands</h1>
          <p style={{ fontSize: 15.5, color: "#9a9286", lineHeight: 1.65, margin: "0 0 20px", maxWidth: 560 }}>
            A playing card deck featuring original artwork from 54 artists — one card per artist, one template by the Holding. Artwork is submitted via Google Form. All participating artists receive an equal share of sales.
          </p>
          <div style={{ display: "flex", gap: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6f6759" }}>
            {[
              { label: "Cards claimed", value: `${takenCount} / ${totalSlots}` },
              { label: "Available", value: String(totalSlots - takenCount) },
              deadlineStr ? { label: "Submission deadline", value: deadlineStr } : null,
              { label: "Revenue split", value: "Equal / artist" },
            ].filter(Boolean).map((item) => item && (
              <div key={item.label}>
                <span style={{ color: "#3a342b" }}>{item.label}: </span>
                <span style={{ color: "#c9bfaf" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#1e1b15", borderRadius: 999, marginBottom: 32, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(takenCount / totalSlots) * 100}%`, background: ACCENT, borderRadius: 999, transition: "width 0.4s ease" }} />
        </div>

        {/* Card grid */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 16 }}>
            Card grid — hover to see who claimed each card
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SUITS.map((suit) => (
              <div key={suit} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 22, fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: suitColor(suit), flexShrink: 0, textAlign: "center" as const, lineHeight: 1 }}>{suit}</span>
                <div style={{ flex: 1, display: "flex", gap: 4 }}>
                  {VALUES.map((value) => {
                    const key = `${value}${suit}`;
                    const claimant = registrations.get(key);
                    const isHighlighted = highlightCard === key;
                    return (
                      <div
                        key={key}
                        id={`card-${key}`}
                        title={claimant ? claimant : "Available"}
                        style={{
                          flex: 1,
                          aspectRatio: "1/1.4",
                          borderRadius: 5,
                          border: isHighlighted ? `1px solid ${ACCENT}` : claimant ? "1px solid #221e17" : "1px solid #2a2519",
                          background: isHighlighted ? `rgba(216,162,74,0.14)` : claimant ? "#111009" : "rgba(216,162,74,0.03)",
                          display: "flex",
                          flexDirection: "column" as const,
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          minWidth: 0,
                          cursor: claimant ? "default" : "pointer",
                          transition: "border-color 0.15s, background 0.15s",
                          boxShadow: isHighlighted ? `0 0 12px ${ACCENT}20` : "none",
                        }}
                      >
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: isHighlighted ? suitColor(suit) : claimant ? "#3a342b" : suitColor(suit), lineHeight: 1, opacity: claimant && !isHighlighted ? 0.5 : 1 }}>{value}</div>
                        {claimant ? (
                          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 7, color: isHighlighted ? ACCENT : "#3a342b", lineHeight: 1, overflow: "hidden", maxWidth: "90%", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                            {claimant.split(" ")[0]}
                          </div>
                        ) : (
                          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#2a251d" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Jokers */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ width: 22, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#4a4538", flexShrink: 0, textAlign: "center" as const }}>★</span>
              <div style={{ display: "flex", gap: 4 }}>
                {(["Joker Red", "Joker Black"] as const).map((joker) => {
                  const claimant = registrations.get(joker);
                  const isHighlighted = highlightCard === joker;
                  const isRed = joker === "Joker Red";
                  return (
                    <div
                      key={joker}
                      id={`card-${joker}`}
                      title={claimant ? claimant : joker}
                      style={{ width: 46, aspectRatio: "1/1.4", borderRadius: 5, border: isHighlighted ? `1px solid ${ACCENT}` : claimant ? "1px solid #221e17" : "1px solid #2a2519", background: isHighlighted ? "rgba(216,162,74,0.14)" : claimant ? "#111009" : "rgba(216,162,74,0.03)", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 1, boxShadow: isHighlighted ? `0 0 12px ${ACCENT}20` : "none" }}
                    >
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: claimant && !isHighlighted ? "#3a342b" : (isRed ? "#c97b6a" : "#c9bfaf"), lineHeight: 1 }}>{isRed ? "J♥" : "J♠"}</div>
                      {claimant && (
                        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 7, color: isHighlighted ? ACCENT : "#3a342b", lineHeight: 1 }}>{claimant.split(" ")[0]}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 14, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6f6759" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#111009", border: "1px solid #221e17", display: "inline-block" }} />Claimed
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(216,162,74,0.03)", border: "1px solid #2a2519", display: "inline-block" }} />Available
            </span>
            <span style={{ marginLeft: "auto" }}>{takenCount} / {totalSlots} claimed</span>
          </div>
        </div>

        {/* Registration or result */}
        {!isFull ? (
          result ? (
            <ResultPanel result={result} formUrl={formUrl} onReset={() => { setResult(null); setHighlightCard(null); }} />
          ) : (
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "24px 26px", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 6px" }}>Claim your card</h2>
              <p style={{ color: "#847b6d", margin: "0 0 22px", fontSize: 13.5, lineHeight: 1.55 }}>
                Enter your name and email — you'll be assigned a random card from the remaining {totalSlots - takenCount} available. Your assignment is permanent once confirmed.
              </p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Your name</div>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Artist name"
                      autoComplete="name"
                      style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid #2c271f`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }}
                      onFocus={e => e.currentTarget.style.borderColor = ACCENT}
                      onBlur={e => e.currentTarget.style.borderColor = "#2c271f"}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#847b6d", textTransform: "uppercase" as const, marginBottom: 7 }}>Email</div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      style={{ width: "100%", boxSizing: "border-box" as const, background: BG, border: `1px solid #2c271f`, borderRadius: 10, color: "#efe9dd", padding: "11px 14px", fontSize: 14, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none" }}
                      onFocus={e => e.currentTarget.style.borderColor = ACCENT}
                      onBlur={e => e.currentTarget.style.borderColor = "#2c271f"}
                    />
                  </div>
                </div>

                {fieldError && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#e07070", background: "rgba(224,112,112,0.08)", border: "1px solid rgba(224,112,112,0.18)", borderRadius: 8, padding: "10px 12px" }}>
                    {fieldError}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ height: 46, padding: "0 28px", borderRadius: 11, border: "none", background: submitting ? "#6b5a32" : ACCENT, color: "#1a1408", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}
                  >
                    {submitting ? "Assigning…" : "Claim my card →"}
                  </button>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#5f594f", lineHeight: 1.5 }}>
                    Assigned randomly.<br />Locked once confirmed.
                  </span>
                </div>
              </form>
            </div>
          )
        ) : (
          <VolumeTwoPanel nextProject={nextProject} />
        )}

        {/* Submission info (always visible) */}
        {!result && !isFull && (
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, margin: "0 0 5px" }}>Already have your card?</h2>
                <p style={{ color: "#847b6d", margin: 0, fontSize: 13 }}>Submit your artwork using the Google Form below.</p>
              </div>
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flexShrink: 0, height: 42, padding: "0 20px", borderRadius: 10, background: ACCENT, color: "#1a1408", fontWeight: 600, fontSize: 14, textDecoration: "none", fontFamily: "'Hanken Grotesk', sans-serif", display: "flex", alignItems: "center", whiteSpace: "nowrap" as const }}
              >
                Submit artwork →
              </a>
            </div>
          </div>
        )}

        {/* Artwork template preview */}
        <ArtworkPreviewSection />

        {/* Project info, revenue split, milestone */}
        <ProjectDetailsSection totalSlots={totalSlots} />

        {/* AI disclosure */}
        <div style={{ marginTop: 48, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase" as const, flexShrink: 0, paddingTop: 2 }}>AI disclosure</div>
          <div style={{ width: 1, background: BORDER, alignSelf: "stretch", flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#9a9286", lineHeight: 1.7 }}>
            The planning of this project was made with the assistance of AI tools. The concept, vision, and creative direction behind 54 Hands and The Holding are entirely human.
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, formUrl, onReset }: { result: RegistrationResult; formUrl: string; onReset: () => void }) {
  if (result.status === "conflict") {
    return (
      <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: "24px 26px", marginBottom: 24 }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#d09a6a", margin: "0 0 14px" }}>A race condition occurred — two people submitted at the same time.</p>
        <button onClick={onReset} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: `1px solid #322b21`, background: "transparent", color: "#c5bcae", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>Try again</button>
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
    <div style={{ background: PANEL, border: `1px solid ${isNew ? ACCENT + "60" : "#262119"}`, borderRadius: 16, padding: "28px 26px", marginBottom: 24, boxShadow: isNew ? `0 0 40px ${ACCENT}10` : "none" }}>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {card && <CardFace cardKey={card} large />}
        <div style={{ flex: 1 }}>
          {isNew ? (
            <>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#93a877", textTransform: "uppercase" as const, marginBottom: 10 }}>Card assigned ✓</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 400, margin: "0 0 6px" }}>
                You got the <em style={{ color: ACCENT }}>{parsed?.value} {parsed?.suit}</em>
              </h2>
              <p style={{ color: "#9a9286", margin: "0 0 20px", fontSize: 14, lineHeight: 1.55 }}>
                Your card is locked in. Now create your artwork to fit the card template — then submit it using the form below.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase" as const, marginBottom: 10 }}>Already registered</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 400, margin: "0 0 6px" }}>
                Your card is the <em style={{ color: ACCENT }}>{parsed?.value} {parsed?.suit}</em>
              </h2>
              <p style={{ color: "#9a9286", margin: "0 0 20px", fontSize: 14, lineHeight: 1.55 }}>
                You're already registered. Submit your artwork using the form below.
              </p>
            </>
          )}
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 22px", borderRadius: 10, background: ACCENT, color: "#1a1408", fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "'Hanken Grotesk', sans-serif" }}
          >
            Submit your artwork →
          </a>
        </div>
      </div>
    </div>
  );
}

function VolumeTwoPanel({ nextProject }: { nextProject: Project | null }) {
  return (
    <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: "32px 26px", marginBottom: 24, textAlign: "center" as const }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 14 }}>
        All 54 cards claimed
      </div>
      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 400, margin: "0 0 10px" }}>Volume 2 is coming</h2>
      <p style={{ color: "#9a9286", margin: "0 auto 24px", fontSize: 14, lineHeight: 1.65, maxWidth: 420 }}>
        {nextProject?.description ?? "54 more cards, 54 more artists. Registration for Volume 2 will open soon."}
      </p>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5f594f" }}>
        Follow <span style={{ color: ACCENT }}>The Holding</span> for updates on Volume 2 registration.
      </div>
    </div>
  );
}

function ProjectDetailsSection({ totalSlots }: { totalSlots: number }) {
  const MILESTONE = 250;
  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ borderTop: "1px solid #1e1b15", paddingTop: 40, marginBottom: 28 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#5f594f", textTransform: "uppercase" as const, marginBottom: 8 }}>
          About 54 Hands
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, fontWeight: 400, margin: 0 }}>How it works</h2>
      </div>

      {/* Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { step: "01", title: "Claim a card", body: "Register with your name and email. You receive one randomly assigned card from the 54-card deck." },
          { step: "02", title: "Create artwork", body: "Make original artwork sized 1.8 × 2.8 in — centered in the 2 × 3 in card. The Holding provides the template." },
          { step: "03", title: "Submit via form", body: "Upload through the Google Form. The Holding handles production, printing, and distribution." },
          { step: "04", title: "Earn & own", body: "Receive your equal share of every sale. Hit 250 decks sold and every artist gets a free copy of the deck." },
        ].map(({ step, title, body }) => (
          <div key={step} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 20px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, color: "#221e17", lineHeight: 1, marginBottom: 12 }}>{step}</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "#efe9dd", marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 12.5, color: "#847b6d", lineHeight: 1.65 }}>{body}</div>
          </div>
        ))}
      </div>

      {/* Revenue + Milestone row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Revenue model */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "22px 22px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 16 }}>Revenue model</div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACCENT }}>Artists (equal split)</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: ACCENT }}>50%</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: "#1e1b15", overflow: "hidden", marginBottom: 14 }}>
              <div style={{ height: "100%", width: "50%", background: ACCENT, borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6f6759" }}>Commons treasury</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: "#6f6759" }}>50%</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: "#1e1b15", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "50%", background: "#2a241b", border: "1px solid #3a3327", borderRadius: 999, boxSizing: "border-box" as const }} />
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#9a9286", lineHeight: 1.65, paddingTop: 14, borderTop: "1px solid #1e1b15" }}>
            Every sale splits 50/50. The artists' half is divided equally among all {totalSlots} participants — no hierarchy, no tiers. The treasury half funds materials, production, and the infrastructure behind The Holding.
          </div>
          <div style={{ marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#4a4538", padding: "8px 10px", borderRadius: 7, background: "#111009" }}>
            Your share per deck sold = deck price × 0.5 ÷ {totalSlots}
          </div>
        </div>

        {/* Milestone */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "22px 22px", display: "flex", flexDirection: "column" as const }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 16 }}>Milestone</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 56, color: ACCENT, lineHeight: 1 }}>{MILESTONE}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#6f6759", lineHeight: 1.4 }}>decks<br />sold</div>
          </div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: "#efe9dd", marginBottom: 10 }}>Every artist gets a free complete deck</div>
          <div style={{ fontSize: 13, color: "#9a9286", lineHeight: 1.65, flex: 1 }}>
            Once 54 Hands reaches {MILESTONE} copies sold, each of the {totalSlots} participating artists receives a complimentary full deck — every card, all 54 artists' work, printed and shipped to you at no cost.
          </div>
          <div style={{ marginTop: 16, height: 6, borderRadius: 999, background: "#1e1b15", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "0%", background: ACCENT, borderRadius: 999, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#4a4538", marginTop: 6 }}>
            0 / {MILESTONE} sold — milestone in progress
          </div>
        </div>
      </div>

      {/* Deck specs */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "22px 26px", marginBottom: 20 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 18 }}>Deck specifications</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
          {[
            { label: "Total cards", value: String(totalSlots), note: "4 suits × 13 + 2 jokers" },
            { label: "Card size", value: "2.5 × 3.5 in", note: "750 × 1050 px at 300 dpi" },
            { label: "Artwork area", value: "1.8 × 2.8 in", note: "540 × 840 px — 0.35 in margin each side" },
            { label: "Artists", value: `${totalSlots} unique`, note: "One card per artist" },
            { label: "Template", value: "By The Holding", note: "Consistent frame across all 54 cards" },
            { label: "Submission", value: "Google Form", note: "High-resolution digital file" },
          ].map(({ label, value, note }, i) => (
            <div key={label} style={{ padding: "16px 0", borderBottom: i < 3 ? "1px solid #1e1b15" : "none", paddingRight: (i + 1) % 3 !== 0 ? 24 : 0, borderRight: (i + 1) % 3 !== 0 ? "1px solid #1e1b15" : "none", paddingLeft: i % 3 !== 0 ? 24 : 0 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#5f594f", textTransform: "uppercase" as const, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: "#c9bfaf", marginBottom: 4 }}>{value}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3a342b" }}>{note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright & licensing */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "28px 30px", marginBottom: 20 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 6 }}>
          54 Hands: The First Gathering
        </div>
        <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 6px" }}>
          Copyright & licensing
        </h3>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5f594f", margin: "0 0 28px", lineHeight: 1.5 }}>
          What you need to know as an artist — written in plain language intentionally. No legalese.
        </p>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
          {/* YOUR COPYRIGHT */}
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: ACCENT, textTransform: "uppercase" as const, marginBottom: 12 }}>
              Your copyright
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {[
                { head: "Who owns the work:", body: "You do. Always. Participating in 54 Hands does not transfer copyright to Ethra, The Holding, or anyone else." },
                { head: "What you keep:", body: "Full rights to sell, exhibit, reproduce, or use your artwork in any other context — before, during, and after the deck exists." },
                { head: "What doesn't change:", body: "Your name stays attached to your work. You will always be credited as the creator of your card." },
              ].map(({ head, body }) => (
                <div key={head} style={{ display: "flex", gap: 10 }}>
                  <div style={{ color: "#3a342b", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, flexShrink: 0, marginTop: 1 }}>—</div>
                  <div style={{ fontSize: 13.5, color: "#9a9286", lineHeight: 1.65 }}>
                    <span style={{ color: "#c9bfaf", fontWeight: 600 }}>{head}</span>{" "}{body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "#1e1b15" }} />

          {/* HOW YOUR ARTWORK WILL BE USED */}
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: ACCENT, textTransform: "uppercase" as const, marginBottom: 12 }}>
              How your artwork will be used
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {[
                { head: "Printed on:", body: "One card in the 54 Hands physical deck. Your artwork fills the card face." },
                { head: "Promotional use:", body: "Your card may appear in social media posts, the project website, press materials, and documentation about 54 Hands and The Holding. Always with your credit." },
                { head: "Future volumes:", body: "Your artwork will not be used in any future project without a separate agreement." },
                { head: "Not used for:", body: "Merchandise, licensing to third parties, commercial use outside this project, or any purpose not listed above." },
              ].map(({ head, body }) => (
                <div key={head} style={{ display: "flex", gap: 10 }}>
                  <div style={{ color: "#3a342b", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, flexShrink: 0, marginTop: 1 }}>—</div>
                  <div style={{ fontSize: 13.5, color: "#9a9286", lineHeight: 1.65 }}>
                    <span style={{ color: "#c9bfaf", fontWeight: 600 }}>{head}</span>{" "}{body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "#1e1b15" }} />

          {/* THE LICENSE */}
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: ACCENT, textTransform: "uppercase" as const, marginBottom: 12 }}>
              The license you're granting
            </div>
            <p style={{ fontSize: 13.5, color: "#9a9286", lineHeight: 1.7, margin: "0 0 14px" }}>
              By submitting your artwork you're granting Ethra / The Holding a <strong style={{ color: "#c9bfaf" }}>limited, non-exclusive, royalty-free license</strong> to use your artwork solely for the purposes described above.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { term: "Non-exclusive", body: "You can still use your artwork anywhere else." },
                { term: "Limited", body: "We can only use it for 54 Hands." },
                { term: "Royalty-free", body: "No separate licensing fee — your revenue share is your compensation." },
              ].map(({ term, body }) => (
                <div key={term} style={{ background: "#0e0d0b", border: "1px solid #1e1b15", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: ACCENT, marginBottom: 6, letterSpacing: "0.06em" }}>{term}</div>
                  <div style={{ fontSize: 12.5, color: "#7a7267", lineHeight: 1.6 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "#1e1b15" }} />

          {/* WHAT YOU'RE CONFIRMING */}
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: ACCENT, textTransform: "uppercase" as const, marginBottom: 12 }}>
              What you're confirming when you submit
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {[
                { head: "Ownership:", body: "The artwork is your original work and you have the right to license it." },
                { head: "No conflicts:", body: "The artwork is not under an exclusive agreement with a gallery, label, or platform that prevents this use." },
                { head: "No third-party IP:", body: "The artwork does not contain copyrighted characters, logos, or material belonging to someone else." },
              ].map(({ head, body }) => (
                <div key={head} style={{ display: "flex", gap: 10 }}>
                  <div style={{ color: "#3a342b", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, flexShrink: 0, marginTop: 1 }}>—</div>
                  <div style={{ fontSize: 13.5, color: "#9a9286", lineHeight: 1.65 }}>
                    <span style={{ color: "#c9bfaf", fontWeight: 600 }}>{head}</span>{" "}{body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DM callout */}
          <div style={{ background: "rgba(216,162,74,0.06)", border: `1px solid ${ACCENT}25`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 13.5, color: "#9a9286", lineHeight: 1.7 }}>
              If anything here is unclear — an exclusive gallery agreement, collaborative work, or any other specific situation — DM me directly before submitting. We'll figure it out.
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#4a4538", lineHeight: 1.7, borderTop: "1px solid #1e1b15", paddingTop: 16 }}>
            This is not a formal legal contract. It is a plain-language statement of intent. A simple participation agreement will be shared before production begins for everyone to sign.
          </div>
        </div>
      </div>

      {/* Next steps — artist responsibilities */}
      <div style={{ border: `1px solid ${ACCENT}30`, borderRadius: 14, overflow: "hidden" }}>
        {/* Header band */}
        <div style={{ background: `linear-gradient(135deg, rgba(216,162,74,0.12) 0%, rgba(216,162,74,0.04) 100%)`, borderBottom: `1px solid ${ACCENT}20`, padding: "22px 26px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: ACCENT + "aa", textTransform: "uppercase" as const, marginBottom: 8 }}>
            For participating artists
          </div>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 400, margin: "0 0 10px", lineHeight: 1.1 }}>
            Your card is your campaign.
          </h3>
          <p style={{ fontSize: 14.5, color: "#9a9286", margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
            54 Hands only works if 54 people talk about it. The Holding handles production — but the reach comes from you. Every artist who shares the project is doing as much as the one who makes the best card.
          </p>
        </div>

        {/* Action items */}
        <div style={{ background: PANEL, padding: "24px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[
              {
                icon: "→",
                title: "Show your card publicly",
                body: "Once you've submitted your artwork, share it. Post it on Instagram, Twitter, Behance — wherever your audience is. Let people see what their money goes towards.",
              },
              {
                icon: "→",
                title: "Tell the story behind it",
                body: "Why did you make the choices you made? What does your card mean to you? A post about process travels further than a product announcement.",
              },
              {
                icon: "→",
                title: "Ask people to buy",
                body: "This is a group project with a shared milestone. Don't be shy about it — tell your followers directly that buying a deck supports you and 53 other artists at once.",
              },
              {
                icon: "→",
                title: "Tag the other artists",
                body: "You're not promoting alone. Cross-promote with the other 53 artists in the deck. Their audience becomes yours. Every share multiplies across the whole collective.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ display: "flex", gap: 14, padding: "16px 18px", borderRadius: 10, background: "#0e0d0b", border: "1px solid #1e1b15" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, color: ACCENT, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#efe9dd", marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: "#847b6d", lineHeight: 1.65 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Collective message */}
          <div style={{ borderTop: "1px solid #1e1b15", paddingTop: 20, display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, color: "#c9bfaf", lineHeight: 1.7 }}>
                At {250} decks, everyone gets their own free copy. That milestone is reachable — but only if the project actually spreads. You have a card in this deck. That makes it yours to sell.
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "center" as const, padding: "14px 20px", borderRadius: 12, background: "#0e0d0b", border: `1px solid ${ACCENT}25` }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, color: ACCENT, lineHeight: 1 }}>54</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#5f594f", marginTop: 4, letterSpacing: "0.1em" }}>ARTISTS<br />ONE DECK</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
