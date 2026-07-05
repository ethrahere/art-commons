import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

function buildAllCards(): string[] {
  const cards: string[] = [];
  for (const suit of SUITS) for (const value of VALUES) cards.push(`${value}${suit}`);
  cards.push("Joker Red", "Joker Black");
  return cards;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name: string = body?.name?.trim() ?? "";
  const email: string = body?.email?.toLowerCase().trim() ?? "";
  const projectId: string = body?.projectId ?? "";

  if (!name || !email || !projectId) {
    return NextResponse.json({ error: "Name, email, and project are required." }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Check for an existing registration by this email in this project
  const { data: existing } = await supabase
    .from("public_card_registrations")
    .select("card_key")
    .eq("project_id", projectId)
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "already_registered", card: existing.card_key },
      { status: 409 }
    );
  }

  // Get all taken card keys for this project
  const { data: taken } = await supabase
    .from("public_card_registrations")
    .select("card_key")
    .eq("project_id", projectId);

  const takenSet = new Set((taken ?? []).map((r: { card_key: string }) => r.card_key));
  const available = buildAllCards().filter((c) => !takenSet.has(c));

  if (available.length === 0) {
    return NextResponse.json({ error: "all_taken" }, { status: 409 });
  }

  const card = available[Math.floor(Math.random() * available.length)];

  const { error: insertError } = await supabase
    .from("public_card_registrations")
    .insert({ project_id: projectId, name, email, card_key: card });

  if (insertError) {
    // Race condition: card or email was taken between our check and insert
    if (insertError.code === "23505") {
      // Retry once by recursing would complicate things; just tell the user to retry
      return NextResponse.json(
        { error: "conflict", message: "A conflict occurred — please try again." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ card, name });
}
