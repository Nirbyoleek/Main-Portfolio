import { useState } from "react";
import { skills } from "../data/content.js";
import { useScene } from "../hooks.js";
import { createKeyboardScene } from "../three/keyboardScene.js";

export default function Skills() {
  const [active, setActive] = useState(-1);
  const [ref, scene, state] = useScene((el) => createKeyboardScene(el, { skills, onKey: setActive }));
  const s = active >= 0 ? skills[active] : null;

  return (
    <section className="section skills" id="skills" aria-labelledby="skills-title">
      <div className="wrap skills__head">
        <h2 id="skills-title" className="kicker">
          Skills
        </h2>
        <div className="skills__readout" aria-live="polite">
          {s ? (
            <>
              <strong>{s.label}</strong>
              <p>{s.used}</p>
            </>
          ) : (
            <>
              <strong>Every key is a skill</strong>
              <p>
                {state === "unsupported"
                  ? "Pick a skill from the list below."
                  : "Hover or tap a key. On a keyboard, type a letter to press the matching key, or hit space for a wave."}
              </p>
            </>
          )}
        </div>
      </div>

      <div className={`skills__canvas ${state === "unsupported" ? "is-flat" : ""}`} ref={ref} />

      <div className="wrap">
        <ul className="skill-list" aria-label="All skills">
          {skills.map((k, i) => (
            <li key={k.label}>
              <button
                className={i === active ? "is-active" : ""}
                aria-pressed={i === active}
                onClick={() => {
                  setActive(i);
                  scene.current?.pressIndex(i);
                }}
              >
                {k.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
