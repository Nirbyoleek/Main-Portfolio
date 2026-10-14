import { useState } from "react";
import { skills, skillGroups, fundamentals } from "../data/content";
import { useScene } from "../hooks";

export default function Skills() {
  const [active, setActive] = useState(-1);
  const [ref, scene, state] = useScene(() =>
    import("../three/keyboardScene").then(({ createKeyboardScene }) => (el: HTMLElement) =>
      createKeyboardScene(el, { skills, onKey: setActive })
    )
  );
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
              <strong>My working toolkit</strong>
              <p>
                {state === "lite"
                  ? "The full list is below."
                  : "Press a key to see where I've used it. Type a letter to jump to a skill, or hit space."}
              </p>
            </>
          )}
        </div>
      </div>

      <div className={`skills__canvas ${state === "lite" ? "is-flat" : ""}`} ref={ref} />

      <div className="wrap">
        <div className="matrix">
          {skillGroups.map((g) => (
            <div className="matrix__group" key={g.name}>
              <h3>{g.name}</h3>
              <ul>
                {g.items.map((it) => {
                  const k = skills.findIndex((x) => it.name.toLowerCase().startsWith(x.label.toLowerCase().split(" ")[0]));
                  return (
                    <li key={it.name} className={it.core ? "is-core" : ""}>
                      {k >= 0 ? (
                        <button
                          type="button"
                          className={k === active ? "is-active" : ""}
                          onClick={() => {
                            setActive(k);
                            scene.current?.pressIndex(k);
                          }}
                        >
                          {it.name}
                          {it.core && <span className="matrix__core">Core</span>}
                        </button>
                      ) : (
                        <span className="matrix__name">{it.name}</span>
                      )}
                      <span className="matrix__where">{it.where.length ? it.where.join(", ") : "Toolkit"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="fundamentals">
          <strong>Fundamentals:</strong> {fundamentals.join(", ")}.
        </p>
      </div>
    </section>
  );
}
