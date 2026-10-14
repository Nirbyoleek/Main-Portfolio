import { useEffect, useState } from "react";
import { person } from "../data/content.js";

const links = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`nav ${solid ? "nav--solid" : ""} ${open ? "nav--open" : ""}`}>
      <a className="nav__mark" href="#top" aria-label="Nirbyoleek Das, back to top">
        <span>ND</span>
      </a>
      <nav aria-label="Sections">
        <ul className="nav__links" id="nav-links">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)}>
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
      <a className="btn btn--small nav__resume" href={`./${person.resume}`} download>
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
    </header>
  );
}
