"use client";

import { useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }

  return (
    <button
      onClick={copy}
      className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-2.5 transition hover:bg-brand-100"
    >
      <span className="font-mono text-sm font-bold tracking-wider text-brand-700">{code}</span>
      <span className="text-xs font-semibold text-brand-600">
        {copied ? "Copied!" : "Tap to copy"}
      </span>
    </button>
  );
}
