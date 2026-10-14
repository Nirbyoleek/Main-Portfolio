import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { person } from "../data/content";

// A ⌘K / Ctrl+K palette with the things a recruiter usually wants:
// jump to a section, grab the resume, copy the email, open profiles.
interface Action {
  label: string;
  hint: string;
  run: () => void;
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const actions = useMemo<Action[]>(
    () => [
      { label: "Download resume (PDF)", hint: "File", run: () => downloadResume() },
      { label: "Copy email address", hint: person.email, run: () => copy(person.email) },
      { label: "Go to About me", hint: "Section", run: () => go("#about") },
      { label: "Go to Experience", hint: "Section", run: () => go("#work") },
      { label: "Go to Projects", hint: "Section", run: () => go("#projects") },
      { label: "Go to Skills", hint: "Section", run: () => go("#skills") },
      { label: "Go to Contact", hint: "Section", run: () => go("#contact") },
      { label: "Open LinkedIn", hint: "linkedin.com/in/nirbyoleek", run: () => window.open(person.links.linkedin, "_blank", "noopener") },
      { label: "Open GitHub", hint: "github.com/Nirbyoleek", run: () => window.open(person.links.github, "_blank", "noopener") },
    ],
    []
  );
  const list = actions.filter((a) => (a.label + " " + a.hint).toLowerCase().includes(q.trim().toLowerCase()));

  function go(hash: string) {
    onClose();
    setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 40);
  }
  function downloadResume() {
    const a = document.createElement("a");
    a.href = `./${person.resume}`;
    a.download = person.resume;
    document.body.appendChild(a);
    a.click();
    a.remove();
    onClose();
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote("Email copied");
    } catch {
      setNote(text);
    }
    setTimeout(onClose, 700);
  }

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQ("");
    setSel(0);
    setNote("");
    const t = setTimeout(() => input.current?.focus(), 30);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onEsc);
      lastFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(list.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      list[sel]?.run();
    }
  };

  return (
    <div className="palette" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette__box" role="dialog" aria-modal="true" aria-label="Quick actions" onKeyDown={onKeyDown}>
        <input
          ref={input}
          autoFocus
          id="palette-search"
          className="palette__input"
          placeholder="Type a command, like resume or projects"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          aria-controls="palette-list"
          aria-activedescendant={list[sel] ? `pa-${sel}` : undefined}
          autoComplete="off"
        />
        <ul className="palette__list" id="palette-list" role="listbox">
          {list.map((a, i) => (
            <li
              key={a.label}
              id={`pa-${i}`}
              role="option"
              aria-selected={i === sel}
              className={i === sel ? "is-sel" : ""}
              onMouseEnter={() => setSel(i)}
              onClick={() => a.run()}
            >
              <span>{a.label}</span>
              <small>{a.hint}</small>
            </li>
          ))}
          {!list.length && <li className="palette__empty">No match. Try "resume" or "email".</li>}
        </ul>
        <p className="palette__foot">{note || "Enter to run, arrows to move, Esc to close"}</p>
      </div>
    </div>
  );
}
