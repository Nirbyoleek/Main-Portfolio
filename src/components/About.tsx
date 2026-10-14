import type { CSSProperties } from "react";
import { education, experience, person, strengths, impact } from "../data/content";

/** Inline style that sets the bar width through a CSS custom property. */
const barWidth = (w: string) => ({ "--w": w }) as CSSProperties;
import { durationLabel, totalMonths } from "../lib/format";

export default function About() {
  const total = durationLabel(totalMonths(experience));
  const glance = [
    { k: "Role", v: `${person.current.title}, ${person.current.company}` },
    { k: "Experience", v: `${total} across ${experience.length} roles, React since 2021` },
    { k: "Clients", v: "PepsiCo, Wolters Kluwer" },
    { k: "Core stack", v: "React, TypeScript, Node.js, Express, REST, MongoDB" },
    { k: "Education", v: `${education.degree}, ${education.short}, GPA ${education.gpa}` },
    { k: "Location", v: person.location },
    ...(person.openTo ? [{ k: "Open to", v: person.openTo, hi: true }] : []),
  ];

  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="wrap about__grid">
        <div className="about__lead">
          <h2 id="about-title" className="kicker">
            About me
          </h2>
          <p className="about__statement">
            I'm a software engineer who owns features from the database index to the hover state, and
            I measure my work by what it changes for the people using it.
          </p>
          <p className="about__body">
            I started shipping React in 2021 as the only frontend engineer at Trakiot, then worked on
            legal-service flows at Vakilsearch while finishing a CSE degree at SRM with a 9.5 GPA. Since
            2024 I've been at Tiger Analytics, where I've shipped two platforms for PepsiCo and now own
            the frontend architecture of two Wolters Kluwer applications.
          </p>
        </div>

        <aside className="glance" aria-labelledby="glance-title">
          <div className="glance__head">
            <h3 id="glance-title">At a glance</h3>
            <a className="link-btn" href={`./${person.resume}`} download>
              Resume PDF
            </a>
          </div>
          <dl>
            {glance.map((g) => (
              <div key={g.k} className={g.hi ? "is-hi" : ""}>
                <dt>{g.k}</dt>
                <dd>{g.v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      <div className="wrap">
        <h3 className="sub-title">What I bring</h3>
        <ul className="strengths">
          {strengths.map((s) => (
            <li key={s.title}>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </li>
          ))}
        </ul>

        <h3 className="sub-title">Measured results</h3>
        <ul className="impact">
          {impact.map((d) => {
            const up = d.after > 100;
            return (
              <li key={d.metric} className={up ? "is-up" : "is-down"}>
                <div className="impact__top">
                  <span className="impact__value">{d.change}</span>
                  <span className="impact__what">{d.metric}</span>
                </div>
                <div className="impact__bars" aria-hidden="true">
                  <span className="bar bar--before" style={barWidth(up ? `${(100 / d.after) * 100}%` : "100%")}>
                    <i>Before</i>
                  </span>
                  <span className="bar bar--after" style={barWidth(up ? "100%" : `${d.after}%`)}>
                    <i>After</i>
                  </span>
                </div>
                <p className="impact__where">
                  {d.where}. {d.how}.
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
