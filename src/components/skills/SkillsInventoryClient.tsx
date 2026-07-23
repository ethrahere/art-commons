"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SkillKind } from "@/types";

const ACCENT = "#d8a24a";
const PANEL = "#15130f";
const BG = "#0e0d0b";
const NEED = "#c97b6a";

// Seed vocabulary — keywords are matched against an artist's bio to suggest a
// category, but the field itself stays free text so the list can grow.
const BASE_KEYWORDS: Record<string, string[]> = {
  "Web Design": ["web design", "website", "web dev", "frontend", "front-end", "ui design", "ux design"],
  "Music": ["music", "musician", "sound design", "composer", "producer", "audio"],
  "Photography": ["photo", "photograph"],
  "Styling": ["stylist", "styling", "fashion"],
  "Workshop Facilitation": ["workshop", "facilitat", "mentor", "teach"],
  "Fabrication": ["fabricat", "woodwork", "metalwork", "3d print", "carpentry", "sculpt", "build"],
  "Writing": ["writ", "copywr", "editor", "poet"],
};

function titleCase(s: string) {
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function suggestFromBio(bio: string | null, disciplines: string[]): string[] {
  const found = new Set<string>();
  const text = (bio ?? "").toLowerCase();
  for (const [label, keywords] of Object.entries(BASE_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) found.add(label);
  }
  for (const d of disciplines) {
    if (d.trim()) found.add(titleCase(d));
  }
  return [...found];
}

export interface SkillEntryWithAuthor {
  id: string;
  kind: SkillKind;
  skill: string;
  note: string | null;
  profile_id: string;
  display_name: string | null;
  username: string;
}

export interface CurrentArtist {
  id: string;
  displayName: string;
  username: string;
  bio: string | null;
  disciplines: string[];
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function SkillsInventoryClient({
  initialEntries,
  currentArtist,
}: {
  initialEntries: SkillEntryWithAuthor[];
  currentArtist: CurrentArtist;
}) {
  const supabase = createClient();
  const [entries, setEntries] = useState(initialEntries);
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<SkillKind>("offer");
  const [skill, setSkill] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bioSuggestions = useMemo(
    () => suggestFromBio(currentArtist.bio, currentArtist.disciplines),
    [currentArtist.bio, currentArtist.disciplines]
  );

  const rows = useMemo(() => {
    const groups = new Map<string, { display: string; offers: SkillEntryWithAuthor[]; needs: SkillEntryWithAuthor[] }>();
    for (const e of entries) {
      const key = e.skill.trim().toLowerCase();
      if (!groups.has(key)) groups.set(key, { display: e.skill.trim(), offers: [], needs: [] });
      const g = groups.get(key)!;
      (e.kind === "offer" ? g.offers : g.needs).push(e);
    }
    return [...groups.values()].sort(
      (a, b) => b.offers.length + b.needs.length - (a.offers.length + a.needs.length) || a.display.localeCompare(b.display)
    );
  }, [entries]);

  const existingCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      const key = e.skill.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, e.skill.trim());
    }
    return [...seen.values()];
  }, [entries]);

  const suggestions = useMemo(() => {
    const combined = [...bioSuggestions, ...existingCategories];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of combined) {
      const key = s.toLowerCase();
      if (!seen.has(key) && key !== skill.trim().toLowerCase()) {
        seen.add(key);
        out.push(s);
      }
    }
    return out.slice(0, 8);
  }, [bioSuggestions, existingCategories, skill]);

  async function submit() {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);

    const { data, error: dbErr } = await supabase
      .from("skill_entries")
      .insert({ profile_id: currentArtist.id, kind, skill: trimmed, note: note.trim() || null })
      .select("id, kind, skill, note, profile_id")
      .single();

    if (dbErr || !data) {
      setError(dbErr?.message ?? "Could not save that entry.");
      setSaving(false);
      return;
    }

    setEntries((prev) => [
      ...prev,
      {
        id: data.id,
        kind: data.kind,
        skill: data.skill,
        note: data.note,
        profile_id: data.profile_id,
        display_name: currentArtist.displayName,
        username: currentArtist.username,
      },
    ]);
    setSkill("");
    setNote("");
    setSaving(false);
    setFormOpen(false);
  }

  return (
    <div style={{ background: PANEL, border: "1px solid #262119", borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end", gap: 16, marginBottom: 16 }}>
        <button
          onClick={() => setFormOpen((v) => !v)}
          style={{ height: 36, padding: "0 16px", borderRadius: 9, border: formOpen ? "1px solid #322b21" : "none", background: formOpen ? "transparent" : ACCENT, color: formOpen ? "#9a9286" : "#1a1408", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif", flexShrink: 0 }}
        >
          {formOpen ? "Cancel" : "+ Add to inventory"}
        </button>
      </div>

      {formOpen && (
        <div style={{ background: BG, border: "1px solid #221e17", borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["offer", "need"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  padding: "7px 14px",
                  borderRadius: 999,
                  cursor: "pointer",
                  background: kind === k ? (k === "offer" ? "rgba(147,168,119,0.14)" : "rgba(201,123,106,0.14)") : "transparent",
                  border: `1px solid ${kind === k ? (k === "offer" ? "#3a4430" : "#4a2e28") : "#2c271f"}`,
                  color: kind === k ? (k === "offer" ? "#93a877" : NEED) : "#847b6d",
                }}
              >
                {k === "offer" ? "I'm offering" : "I'm looking for"}
              </button>
            ))}
          </div>

          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Category — e.g. Web Design, Photography, Fabrication…"
            style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 9, border: "1px solid #322b21", background: PANEL, color: "#d6cdbd", fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none", marginBottom: 8, boxSizing: "border-box" as const }}
          />

          {suggestions.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 12 }}>
              {suggestions.map((s) => (
                <span
                  key={s}
                  onClick={() => setSkill(s)}
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "4px 10px", borderRadius: 999, background: "rgba(216,162,74,0.08)", border: "1px solid #3a3327", color: ACCENT, cursor: "pointer" }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note — e.g. availability, style, rate…"
            style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 9, border: "1px solid #322b21", background: PANEL, color: "#d6cdbd", fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", outline: "none", marginBottom: 12, boxSizing: "border-box" as const }}
          />

          {error && (
            <div style={{ marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: NEED }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!skill.trim() || saving}
            style={{ height: 36, padding: "0 18px", borderRadius: 9, border: "none", background: skill.trim() && !saving ? ACCENT : "#221e17", color: skill.trim() && !saving ? "#1a1408" : "#5f594f", fontSize: 13, fontWeight: 600, cursor: skill.trim() && !saving ? "pointer" : "default", fontFamily: "'Hanken Grotesk', sans-serif" }}
          >
            {saving ? "Saving…" : "Add entry"}
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#6f6759", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
          No entries yet — be the first to map what you bring.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 12, overflow: "hidden", border: "1px solid #221e17" }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", background: "#1a1610", padding: "9px 14px" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", color: "#6f6759", textTransform: "uppercase" as const }}>Category</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", color: "#93a877", textTransform: "uppercase" as const }}>Offering</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", color: NEED, textTransform: "uppercase" as const }}>Looking for</span>
          </div>
          {rows.map((row, i) => (
            <div key={row.display} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", padding: "12px 14px", background: BG, borderTop: i === 0 ? "none" : "1px solid #1a1610", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#efe9dd" }}>{row.display}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                {row.offers.length === 0 ? (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#3a342b" }}>—</span>
                ) : (
                  row.offers.map((e) => <PersonChip key={e.id} entry={e} color="#93a877" bg="rgba(147,168,119,0.1)" />)
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                {row.needs.length === 0 ? (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#3a342b" }}>—</span>
                ) : (
                  row.needs.map((e) => <PersonChip key={e.id} entry={e} color={NEED} bg="rgba(201,123,106,0.1)" />)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonChip({ entry, color, bg }: { entry: SkillEntryWithAuthor; color: string; bg: string }) {
  const name = entry.display_name ?? entry.username;
  return (
    <Link
      href={`/directory/${entry.username}`}
      title={entry.note ?? undefined}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, padding: "4px 9px 4px 4px", borderRadius: 999, background: bg, color, textDecoration: "none" }}
    >
      <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Serif', serif", fontSize: 9 }}>
        {initials(name)}
      </span>
      {name}
    </Link>
  );
}
