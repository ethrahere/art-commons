"use client";

import { useEffect, useRef, useState } from "react";
import { CARD_BACK_SRC, cardImageSrc, type DeckCardInfo } from "./deck";
import styles from "./preorder.module.css";

// onError alone misses images that 404 before hydration, so also check on mount.
function useImageFallback() {
  const ref = useRef<HTMLImageElement>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);
  return { ref, missing, onError: () => setMissing(true) };
}

// A single card face. Shows the artwork from public/54-hands/deck/ if it exists,
// otherwise a placeholder laid out like the printed cards (rank top-left, suit
// top-right, framed art area, artist credit centred below).
export function DeckCard({
  card,
  artist,
  className,
  eager,
}: {
  card: DeckCardInfo;
  artist?: string;
  className?: string;
  eager?: boolean;
}) {
  const { ref, missing, onError } = useImageFallback();

  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      {!missing ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cardImageSrc(card.slug)}
          alt={artist ? `${card.key} by ${artist}` : card.key}
          loading={eager ? "eager" : "lazy"}
          ref={ref}
          onError={onError}
          className={styles.cardImage}
        />
      ) : (
        <div className={`${styles.cardFace} ${card.red ? styles.red : ""}`}>
          <span className={styles.rank}>{card.value === "Joker" ? "J" : card.value}</span>
          <span className={styles.suit}>{card.suit}</span>
          <div className={styles.artFrame}>
            <span className={styles.artSuit}>{card.suit}</span>
            {card.value === "Joker" && <span className={styles.artJoker}>Joker</span>}
          </div>
          <span className={styles.credit}>{artist ?? "Artist to be revealed"}</span>
        </div>
      )}
    </div>
  );
}

export function DeckBack({ className }: { className?: string }) {
  const { ref, missing, onError } = useImageFallback();

  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      {!missing ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={CARD_BACK_SRC} alt="Card back" ref={ref} onError={onError} className={styles.cardImage} />
      ) : (
        <div className={styles.cardBack}>
          <div className={styles.cardBackInner}>
            <span>54</span>
            <small>The Holding</small>
          </div>
        </div>
      )}
    </div>
  );
}
