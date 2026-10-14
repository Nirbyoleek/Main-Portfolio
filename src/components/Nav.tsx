import { useCallback, useEffect, useRef, useState } from "react";
import { person } from "../data/content";
import CommandPalette from "./CommandPalette";

const links = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [active, setActive] = useState("");
  const [palette, setPalette] = useState(false);
  const bar = useRef<HTMLSpanElement | null>(null);
  const closePalette = useCallback(() => setPalette(false), []);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // Solid background, reading progress and the current section.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      let cur = "";
      for (const l of links) {
        const el = document.querySelector(l.href);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = l.href;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(false);
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={`nav ${solid ? "nav--solid" : ""} ${open ? "nav--open" : ""}`}>
        <a className="nav__mark" href="#top" aria-label="Nirbyoleek Das, back to top">
          <span>ND</span>
        </a>
        <span className="nav__who" aria-hidden={!solid}>
          {person.firstName} {person.lastName}
          <small>{person.role}</small>
        </span>
        <nav aria-label="Sections">
          <ul className="nav__links" id="nav-links">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={active === l.href ? "is-active" : ""}
                  aria-current={active === l.href ? "true" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="nav__resume-mobile">
              <a href={`./${person.resume}`} download onClick={() => setOpen(false)}>
                Download resume
              </a>
            </li>
          </ul>
        </nav>
        <button className="nav__k" onClick={() => setPalette(true)} aria-label="Open quick actions">
          <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
          <kbd>K</kbd>
        </button>
        <a className="btn btn--small btn--primary nav__resume" href={`./${person.resume}`} download>
          Resume
        </a>
        <button
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <i aria-hidden="true" />
          <i aria-hidden="true" />
        </button>
        <span className="nav__progress" ref={bar} aria-hidden="true" />
      </header>
      <CommandPalette open={palette} onClose={closePalette} />
    </>
  );
}
