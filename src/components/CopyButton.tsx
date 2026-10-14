import { useState } from "react";

/** Copies `text` and confirms in place; falls back to selecting a hidden field. */
interface Props {
  text: string;
  label?: string;
  done?: string;
  className?: string;
}

export default function CopyButton({ text, label = "Copy email", done = "Copied", className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try */
      }
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button type="button" className={`copy-btn ${copied ? "is-done" : ""} ${className}`} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {copied ? (
          <path d="M5 12.5l4.2 4.2L19 7" />
        ) : (
          <>
            <rect x="8" y="8" width="12" height="12" rx="2.5" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          </>
        )}
      </svg>
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}
