"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";
const BG = "#0e0d0b";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
type Suit = (typeof SUITS)[number];

const RED_SUITS = new Set(["♥", "♦"]);
function suitColor(suit: Suit): string {
  return RED_SUITS.has(suit) ? "#c97b6a" : "#c9bfaf";
}

function buildAllCards(): string[] {
  const cards: string[] = [];
  for (const suit of SUITS) for (const value of VALUES) cards.push(`${value}${suit}`);
  cards.push("Joker Red", "Joker Black");
  return cards;
}
const ALL_CARDS = buildAllCards();

export interface AssignmentData {
  card: string;
  profileId: string;
  artist: string;
  initials: string;
  submissionStatus: "pending" | "approved" | "rejected" | "revision_requested" | "not_submitted" | "submitted";
}

export interface WaitingParticipant {
  profileId: string;
  name: string;
  initials: string;
}

interface Props {
  project: Project | null;
  initialAssignments: AssignmentData[];
  waitingParticipants: WaitingParticipant[];
}

const STATUS_META = {
  submitted:         { label: "Submitted",   color: "#93a877", bg: "rgba(147,168,119,0.1)" },
  approved:          { label: "Approved",    color: "#93a877", bg: "rgba(147,168,119,0.1)" },
  pending:           { label: "Pending",     color: ACCENT,    bg: "rgba(216,162,74,0.09)" },
  revision_requested:{ label: "Revision",    color: "#d09a6a", bg: "#211d16" },
  not_submitted:     { label: "Not sent",    color: "#6f6759", bg: "#211d16" },
  rejected:          { label: "Rejected",    color: "#c97b6a", bg: "#211d16" },
};

export default function ProjectsClient({ project, initialAssignments, waitingParticipants: initialWaiting }: Props) {
  const supabase = createClient();

  const [assignments, setAssignments] = useState<Map<string, AssignmentData>>(() => {
    const map = new Map<string, AssignmentData>();
    for (const a of initialAssignments) map.set(a.card, a);
    return map;
  });
  const [waiting, setWaiting] = useState<WaitingParticipant[]>(initialWaiting);
  const [selected, setSelected] = useState("");
  const [lastAssigned, setLastAssigned] = useState<{ card: string; artist: string } | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unassignedCards = ALL_CARDS.filter((c) => !assignments.has(c));

  async function assignCard() {
    if (!selected || unassignedCards.length === 0 || !project) return;
    setAssigning(true);
    setError(null);

    const picked = unassignedCards[Math.floor(Math.random() * unassignedCards.length)];
    const artist = waiting.find((w) => w.profileId === selected)!;

    const { error: dbErr } = await supabase.from("project_card_assignments").insert({
      project_id: project.id,
      profile_id: artist.profileId,
      card_key: picked,
    });

    if (dbErr) {
      setError(dbErr.message);
      setAssigning(false);
      return;
    }

    const newEntry: AssignmentData = {
      card: picked,
      profileId: artist.profileId,
      artist: artist.name,
      initials: artist.initials,
      submissionStatus: "not_submitted",
    };
    setAssignments((prev) => new Map(prev).set(picked, newEntry));
    setWaiting((prev) => prev.filter((w) => w.profileId !== selected));
    setLastAssigned({ card: picked, artist: artist.name });
    setSelected("");
    setAssigning(false);
  }

  const assignedCount = assignments.size;
  const submittedCount = [...assignments.values()].filter(
    (a) => a.submissionStatus === "submitted" || a.submissionStatus === "approved"
  ).length;
  const openCount = (project?.total_slots ?? 54) - assignedCount;

  if (!project) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
        No active project found.
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb + header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span>Projects</span>
          <span style={{ color: "#3a342b" }}>→</span>
          <span style={{ color: ACCENT }}>Current</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, margin: "0 0 6px", lineHeight: 1 }}>{project.title}</h1>
            <p style={{ color: "#9a9286", margin: 0, fontSize: 14.5, maxWidth: 520 }}>{project.description}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <Link href="/projects/past" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#847b6d", textDecoration: "none" }}>
              Past projects →
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, padding: "6px 13px", borderRadius: 999, background: "rgba(147,168,119,0.1)", border: "1px solid #3a4430", color: "#93a877" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#93a877", display: "inline-block" }} />
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginBottom: 18, background: PANEL, border: "1px solid #262119", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 10 }}>About</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#c5bcae", margin: 0 }}>
            Artists create artwork for a single card in a custom-designed {project.total_slots}-card playing deck. The deck template is designed by the Holding — same shape, your vision. Submissions come through the Google Form; cards are assigned randomly to accepted artists.
          </p>
        </div>
        <div style={{ padding: "20px 24px", borderLeft: "1px solid #221e17" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 14 }}>Key details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              { label: "Format",     value: `${project.total_slots}-card playing deck` },
              { label: "Template by",value: "The Holding" },
              { label: "Card size",  value: "63 × 88 mm" },
              { label: "Submission", value: project.google_form_url ? "Google Form" : "Coming soon" },
              { label: "Revenue",    value: "50/50 — equal split" },
              { label: "Closes",     value: project.end_date ? new Date(project.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "TBD" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#6f6759" }}>{label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#c9bfaf" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        {[
          { label: "Cards assigned",    value: String(assignedCount),   sub: `of ${project.total_slots} total`, accent: true },
          { label: "Slots open",        value: String(openCount),       sub: "first-come basis",               accent: false },
          { label: "Artwork in",        value: String(submittedCount),  sub: "confirmed pieces",               accent: false },
          { label: "Submission close",  value: project.end_date ? new Date(project.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase() : "TBD", sub: project.end_date ? String(new Date(project.end_date).getFullYear()) : "", accent: false },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: PANEL, border: "1px solid #262119", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: "#6f6759", textTransform: "uppercase" as const, marginBottom: 10 }}>{label}</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, lineHeight: 1, color: accent ? ACCENT : "#efe9dd" }}>{value}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6f6759", marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Card assignment */}
      <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, margin: "0 0 4px" }}>Card assignment</h2>
            <p style={{ color: "#847b6d", margin: 0, fontSize: 13 }}>Assign a card randomly to an accepted artist. Assignments are permanent.</p>
          </div>
          {waiting.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                style={{ height: 36, padding: "0 10px", borderRadius: 9, border: "1px solid #322b21", background: BG, color: "#d6cdbd", fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none", cursor: "pointer" }}
              >
                <option value="">Select artist…</option>
                {waiting.map((w) => (
                  <option key={w.profileId} value={w.profileId}>{w.name}</option>
                ))}
              </select>
              <button
                onClick={assignCard}
                disabled={!selected || assigning}
                style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: selected && !assigning ? ACCENT : "#221e17", color: selected && !assigning ? "#1a1408" : "#5f594f", fontSize: 13, fontWeight: 600, cursor: selected && !assigning ? "pointer" : "default", fontFamily: "'Hanken Grotesk', sans-serif" }}
              >
                {assigning ? "Assigning…" : "Assign random card"}
              </button>
            </div>
          ) : (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#93a877", padding: "8px 14px", borderRadius: 8, background: "rgba(147,168,119,0.08)", border: "1px solid #3a4430", flexShrink: 0 }}>
              {waiting.length === 0 && assignedCount === 0 ? "No accepted participants yet" : "All participants assigned"}
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "rgba(201,123,106,0.08)", border: "1px solid #4a2e28" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#c97b6a" }}>Error: {error}</span>
          </div>
        )}

        {lastAssigned && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "rgba(147,168,119,0.07)", border: "1px solid #3a4430" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#93a877" }}>
              ✓ <strong>{lastAssigned.artist}</strong> was assigned <strong>{lastAssigned.card}</strong>
            </span>
          </div>
        )}

        {/* Card grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SUITS.map((suit) => (
            <div key={suit} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 22, fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: suitColor(suit), flexShrink: 0, textAlign: "center" as const, lineHeight: 1 }}>{suit}</span>
              <div style={{ flex: 1, display: "flex", gap: 4 }}>
                {VALUES.map((value) => {
                  const key = `${value}${suit}`;
                  const a = assignments.get(key);
                  return (
                    <div
                      key={key}
                      title={a ? a.artist : "Unassigned"}
                      style={{ flex: 1, aspectRatio: "1/1.35", borderRadius: 5, border: a ? `1px solid ${ACCENT}50` : "1px solid #1e1b15", background: a ? "rgba(216,162,74,0.07)" : BG, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 2, minWidth: 0 }}
                    >
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: a ? suitColor(suit) : "#2e2a24", lineHeight: 1 }}>{value}</div>
                      {a ? (
                        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 8, color: ACCENT, lineHeight: 1 }}>{a.initials}</div>
                      ) : (
                        <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#252119" }} />
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
                const a = assignments.get(joker);
                const isRed = joker === "Joker Red";
                return (
                  <div key={joker} title={a ? a.artist : joker} style={{ width: 46, aspectRatio: "1/1.35", borderRadius: 5, border: a ? `1px solid ${ACCENT}50` : "1px solid #1e1b15", background: a ? "rgba(216,162,74,0.07)" : BG, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 2 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: a ? (isRed ? "#c97b6a" : "#c9bfaf") : "#2e2a24", lineHeight: 1 }}>{isRed ? "J♥" : "J♠"}</div>
                    {a ? (
                      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 8, color: ACCENT, lineHeight: 1 }}>{a.initials}</div>
                    ) : (
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#252119" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6f6759" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 2, background: "rgba(216,162,74,0.07)", border: `1px solid ${ACCENT}50`, display: "inline-block" }} />Assigned
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 2, background: BG, border: "1px solid #1e1b15", display: "inline-block" }} />Open
          </span>
          <span style={{ marginLeft: "auto" }}>{assignedCount} / {project.total_slots} slots filled</span>
        </div>
      </div>

      {/* Bottom two-column */}
      <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 18 }}>
        {/* Participating artists */}
        <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: "0 0 4px" }}>Participating artists</h2>
          <p style={{ color: "#847b6d", margin: "0 0 14px", fontSize: 13 }}>{assignedCount} assigned · {submittedCount} artwork submitted</p>

          {assignedCount === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
              No cards assigned yet.
            </div>
          ) : (
            <div>
              {[...assignments.values()].map((a, i, arr) => {
                const meta = STATUS_META[a.submissionStatus] ?? STATUS_META.not_submitted;
                return (
                  <div key={a.card} style={{ display: "grid", gridTemplateColumns: "32px 1fr 68px 88px", gap: 12, padding: "11px 0", borderTop: "1px solid #1e1b15", borderBottom: i === arr.length - 1 ? "1px solid #1e1b15" : "none", alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2c2417,#1a1610)", border: "1px solid #322b21", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 13, color: "#c9bfaf", flexShrink: 0 }}>
                      {a.initials}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{a.artist}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: ACCENT }}>{a.card}</div>
                    <div>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: "3px 7px", borderRadius: 5, background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Revenue model */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: "0 0 14px" }}>Revenue model</h2>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, color: "#1a1408", flexShrink: 0, zIndex: 1 }}>50%</div>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#2a241b", border: "1px solid #3a3327", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#d6cdbd", flexShrink: 0, marginLeft: -10 }}>50%</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#c5bcae", marginLeft: 12 }}>Half to artists equally.<br />Half to the commons.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const }}>
              {[
                { label: "Est. deck price",      value: "₹800" },
                { label: "Artists' pool",        value: "₹400 / deck" },
                { label: `Your share (÷ ${project.total_slots})`, value: `~₹${(400 / project.total_slots).toFixed(2)} / deck` },
                { label: "Target run",           value: "1,000 decks" },
                { label: "Est. payout / artist", value: `~₹${Math.round(400000 / project.total_slots).toLocaleString("en-IN")}` },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid #1e1b15" : "none" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#6f6759" }}>{label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#c9bfaf" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submission */}
          <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, margin: "0 0 8px" }}>Submit your work</h2>
            <p style={{ fontSize: 13, color: "#847b6d", margin: "0 0 18px", lineHeight: 1.55 }}>
              Once your card is assigned, upload your artwork via the form. High-res file, your name, and card number required.
            </p>
            {project.google_form_url ? (
              <a href={project.google_form_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 42, borderRadius: 10, background: ACCENT, color: "#1a1408", fontWeight: 600, fontSize: 14, textDecoration: "none", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                Open submission form →
              </a>
            ) : (
              <div style={{ height: 42, borderRadius: 10, border: "1px dashed #3a342b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5f594f" }}>
                Form link coming soon
              </div>
            )}
            {project.end_date && (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5f594f", textAlign: "center" as const, marginTop: 10 }}>
                Deadline: {new Date(project.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
