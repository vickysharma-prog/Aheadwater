"use client";
import { useState } from "react";

/** A command on one line with a copy button. */
export function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 py-2 pl-4 pr-2 font-mono text-sm text-emerald-300">
      <code className="flex-1 overflow-x-auto whitespace-nowrap">{text}</code>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(text).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
        className="shrink-0 rounded-lg bg-white/10 px-3 py-1 font-sans text-xs font-medium text-white hover:bg-white/20"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
