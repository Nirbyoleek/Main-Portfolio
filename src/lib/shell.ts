// Static HTML for the top of the hero, written into index.html at build
// time. It paints before any JavaScript runs, so the name, headline and
// resume button show immediately; React then takes over the same markup.
import { person, stats } from "../data/content";

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function heroShell(): string {
  const status = [
    `<li><span class="dot" aria-hidden="true"></span>${esc(person.current.title)}, ${esc(person.current.company)}</li>`,
    person.openTo ? `<li class="is-open">Open to ${esc(person.openTo)}</li>` : "",
  ].join("");
  const statItems = stats.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`).join("");
  return (
    `<section class="hero" id="top" aria-label="Introduction"><div class="hero__stage">` +
    `<img class="hero__still" src="./avatar.webp" width="720" height="720" alt="Illustrated avatar of Nirbyoleek at his desk with a laptop" fetchpriority="high">` +
    `<div class="hero__copy">` +
    `<ul class="hero__status">${status}</ul>` +
    `<h1 class="hero__name"><span>${esc(person.firstName)}</span><span>${esc(person.lastName)}</span></h1>` +
    `<p class="hero__role"><strong>${esc(person.role)}.</strong> ${esc(person.headline)}</p>` +
    `<div class="hero__actions">` +
    `<a class="btn btn--primary" href="./${esc(person.resume)}" download><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14"></path></svg>Download resume</a>` +
    `<a class="btn" href="#contact">Contact me</a>` +
    `</div>` +
    `<dl class="hero__stats">${statItems}</dl>` +
    `</div></div></section>`
  );
}
