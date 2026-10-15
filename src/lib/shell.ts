// Static HTML for the top of the hero, written into index.html at build
// time. It paints before any JavaScript runs, so the name, headline and
// resume button show immediately; React then takes over the same markup.
import { avatarModel, person, stats } from "../data/content";

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function heroShell(): string {
  const status = `<li><span class="dot" aria-hidden="true"></span>${esc(person.current.title)}, ${esc(person.current.company)}</li>`;
  const statItems = stats.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`).join("");
  return (
    `<section class="hero${avatarModel ? " hero--pro" : ""}" id="top" aria-label="Introduction"><div class="hero__stage">` +
    `<div class="hero__bg" aria-hidden="true"><span class="hero__glow"></span><span class="hero__floor"></span></div>` +
    `<h1 class="hero__name"><span>${esc(person.firstName)}</span><span>${esc(person.lastName)}</span></h1>` +
    `<img class="hero__still" src="${esc(avatarModel?.still ?? "./avatar.webp")}" width="720" height="900" alt="Avatar of Nirbyoleek" fetchpriority="high">` +
    `<div class="hero__copy">` +
    `<ul class="hero__status">${status}</ul>` +
    `<p class="hero__role"><strong>${esc(person.role)}.</strong> ${esc(person.headline)}</p>` +
    `<div class="hero__actions">` +
    `<a class="btn btn--primary" href="./${esc(person.resume)}" download><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14"></path></svg>Download resume</a>` +
    `<a class="btn btn--ghost" href="#contact">Contact me</a>` +
    `</div>` +
    `<dl class="hero__stats">${statItems}</dl>` +
    `</div></div></section>`
  );
}
