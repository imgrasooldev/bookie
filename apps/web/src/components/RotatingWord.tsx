"use client";

import { useEffect, useState } from "react";

/** Cycles through words with a flip-in animation. */
export function RotatingWord({
  words,
  className = "",
  interval = 2200,
}: {
  words: string[];
  className?: string;
  interval?: number;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span className={`word-in ${className}`} key={i}>
      {words[i]}
    </span>
  );
}
