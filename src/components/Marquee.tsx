import { skills, experience } from "../data/content";

// Two bands of tech and clients crossing below the hero, scrolling in
// opposite directions. Decorative: the same facts are listed in the page.
export default function Marquee() {
  const clients = Array.from(new Set(experience.flatMap((r) => r.clients ?? [])));
  const tech = skills.filter((s) => s.label.length > 2 && !s.label.includes(" ")).slice(0, 14).map((s) => s.label);
  const rowA = [...tech];
  const rowB = [...clients, "Production web apps", "API design", "Frontend architecture", "Shipping on time"];
  return (
    <div className="marquee" aria-hidden="true">
      {[rowA, rowB].map((row, r) => (
        <div className={`marquee__band marquee__band--${r ? "b" : "a"}`} key={r}>
          <div className="marquee__track">
            {[0, 1].map((copy) => (
              <ul key={copy}>
                {row.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
