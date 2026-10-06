// The 54 cards in display order, and where their artwork lives.
//
// Drop card images into public/54-hands/deck/ named by slug, e.g.
//   A-spades.jpg  10-hearts.jpg  K-diamonds.jpg  J-clubs.jpg
//   joker-red.jpg  joker-black.jpg  back.jpg
// Any card without an image renders a styled placeholder, so they can be added
// one at a time. Cards are 57 × 88 mm — export at 674 × 1040 px (300 dpi).

export const DECK_IMAGE_DIR = "/54-hands/deck";
export const DECK_IMAGE_EXT = "png";

export type SuitName = "spades" | "hearts" | "diamonds" | "clubs";

export const SUITS: { symbol: string; name: SuitName; red: boolean }[] = [
  { symbol: "♠", name: "spades", red: false },
  { symbol: "♥", name: "hearts", red: true },
  { symbol: "♦", name: "diamonds", red: true },
  { symbol: "♣", name: "clubs", red: false },
];

const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

export interface DeckCardInfo {
  /** Matches public_card_registrations.card_key, e.g. "A♠" or "Joker Red". */
  key: string;
  value: string;
  suit: string;
  suitName: SuitName | "joker";
  red: boolean;
  slug: string;
}

export const DECK: DeckCardInfo[] = [
  ...SUITS.flatMap(suit =>
    VALUES.map(value => ({
      key: `${value}${suit.symbol}`,
      value,
      suit: suit.symbol,
      suitName: suit.name,
      red: suit.red,
      slug: `${value}-${suit.name}`,
    }))
  ),
  { key: "Joker Red", value: "Joker", suit: "★", suitName: "joker", red: true, slug: "joker-red" },
  { key: "Joker Black", value: "Joker", suit: "★", suitName: "joker", red: false, slug: "joker-black" },
];

export function cardImageSrc(slug: string): string {
  return `${DECK_IMAGE_DIR}/${slug}.${DECK_IMAGE_EXT}`;
}

export const CARD_BACK_SRC = cardImageSrc("back");

export const FAN_SIZE = 5;

/**
 * A random hand of FAN_SIZE card keys for the hero fan, drawn fresh on each
 * request. `available` narrows the draw to cards that have artwork uploaded;
 * if fewer than FAN_SIZE do, it draws from the whole deck.
 */
export function drawHand(available?: Set<string>): string[] {
  const withArt = available ? DECK.filter(c => available.has(c.slug)) : [];
  const pool = (withArt.length >= FAN_SIZE ? withArt : DECK).map(c => c.key);
  // Partial Fisher–Yates: only the first FAN_SIZE positions need shuffling.
  for (let i = 0; i < FAN_SIZE; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, FAN_SIZE);
}
