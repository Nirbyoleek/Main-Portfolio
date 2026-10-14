import { useState } from "react";
import { projects } from "../data/content.js";
import { useScene } from "../hooks.js";
import { createProjectsScene } from "../three/projectsScene.js";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "client", label: "Client" },
  { id: "personal", label: "Personal" },
];

export default function Projects() {
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState("all");
  const [ref, scene, state] = useScene((el) => createProjectsScene(el, { projects, onSelect: setIndex }));
  const p = projects[index];

  const visible = projects.map((x, i) => ({ ...x, i })).filter((x) => filter === "all" || x.type === filter);

  const select = (i) => {
    setIndex(i);
    scene.current?.setIndex(i, false);
  };
  const step = (dir) => {
    const pos = visible.findIndex((x) => x.i === index);
    const next = visible[(((pos < 0 ? 0 : pos) + dir) % visible.length + visible.length) % visible.length];
    select(next.i);
  };
  const pickFilter = (f) => {
    setFilter(f);
    const first = projects.findIndex((x) => f === "all" || x.type === f);
    if (first >= 0 && f !== "all" && projects[index].type !== f) select(first);
  };

  const pos = visible.findIndex((x) => x.i === index);

  return (
    <section className="section projects" id="projects" aria-labelledby="projects-title">
      <div className="wrap projects__head">
        <h2 id="projects-title" className="kicker">
          Projects
        </h2>
        <div className="projects__side">
          <p className="projects__lead">
            Three enterprise platforms I've built at Tiger Analytics and two full-stack apps I made on my
            own. Spin the turntable or use the list.
          </p>
          <div className="segmented" role="group" aria-label="Filter projects">
            {FILTERS.map((f) => (
              <button key={f.id} aria-pressed={filter === f.id} onClick={() => pickFilter(f.id)}>
                {f.label}
                <span>{f.id === "all" ? projects.length : projects.filter((x) => x.type === f.id).length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="projects__grid wrap">
        <div className={`projects__canvas ${state === "unsupported" ? "is-flat" : ""}`} ref={ref}>
          <span className={`projects__status projects__status--${p.status.replace(/\s/g, "").toLowerCase()}`}>
            {p.status}
          </span>
        </div>

        <article className="project" aria-live="polite">
          <p className="project__kind">
            {p.type === "client" ? `Client work at ${p.client}` : "Personal project"}
          </p>
          <h3 className="project__name">{p.name}</h3>
          <p className="project__result">{p.result}</p>
          <dl className="project__meta">
            <div>
              <dt>My role</dt>
              <dd>{p.role}</dd>
            </div>
          </dl>
          <p className="project__summary">{p.summary}</p>
          <ul className="project__highlights">
            {p.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <ul className="chips" aria-label="Built with">
            {p.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="project__actions">
            {p.link ? (
              <a className="btn" href={p.link} target="_blank" rel="noreferrer">
                Open live app
              </a>
            ) : (
              <span className="project__private">Client code is private. Happy to walk through it in an interview.</span>
            )}
            <div className="stepper">
              <button className="icon-btn" onClick={() => step(-1)} aria-label="Previous project">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span className="stepper__count">
                {pos + 1} of {visible.length}
              </span>
              <button className="icon-btn" onClick={() => step(1)} aria-label="Next project">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>

      <div className="wrap">
        <ul className="project-list" aria-label="Projects">
          {visible.map((x) => (
            <li key={x.id}>
              <button className={x.i === index ? "is-active" : ""} aria-pressed={x.i === index} onClick={() => select(x.i)}>
                <span className="project-list__name">{x.name}</span>
                <span className="project-list__result">{x.result}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
