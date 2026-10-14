import { useState } from "react";
import { projects } from "../data/content.js";
import { useScene } from "../hooks.js";
import { createProjectsScene } from "../three/projectsScene.js";

export default function Projects() {
  const [index, setIndex] = useState(0);
  const [ref, scene, state] = useScene((el) =>
    createProjectsScene(el, { projects, onSelect: setIndex })
  );
  const p = projects[index];

  const go = (i) => {
    const n = projects.length;
    const next = ((i % n) + n) % n;
    setIndex(next);
    scene.current?.setIndex(next, false);
  };

  return (
    <section className="section projects" id="projects" aria-labelledby="projects-title">
      <div className="wrap projects__head">
        <h2 id="projects-title" className="kicker">
          Projects
        </h2>
        <p className="projects__lead">
          Three enterprise builds and two things I made for myself. Drag the turntable or pick one.
        </p>
      </div>

      <div className="projects__grid wrap">
        <div
          className={`projects__canvas ${state === "unsupported" ? "is-flat" : ""}`}
          ref={ref}
        />

        <article className="project" aria-live="polite">
          <p className="project__kind">
            {p.kind}, {p.client}
          </p>
          <h3 className="project__name">{p.name}</h3>
          <p className="project__result">{p.result}</p>
          <p className="project__summary">{p.summary}</p>
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
              <span className="project__private">Client work, not public</span>
            )}
            <div className="stepper">
              <button className="icon-btn" onClick={() => go(index - 1)} aria-label="Previous project">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span className="stepper__count">
                {index + 1} of {projects.length}
              </span>
              <button className="icon-btn" onClick={() => go(index + 1)} aria-label="Next project">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>

      <div className="wrap">
        <ul className="project-tabs" aria-label="All projects">
          {projects.map((x, i) => (
            <li key={x.id}>
              <button className={i === index ? "is-active" : ""} aria-pressed={i === index} onClick={() => go(i)}>
                {x.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
