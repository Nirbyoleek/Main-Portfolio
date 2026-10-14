import { useEffect, useRef, useState } from "react";
import { experience } from "../data/content";
import { durationLabel, monthLabel, monthsBetween, totalMonths } from "../lib/format";

export default function Experience() {
  const total = durationLabel(totalMonths(experience));
  // Older roles start collapsed to their first point on small screens.
  const [open, setOpen] = useState(() => new Set<number>([0]));
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  // The timeline's line draws itself as you scroll through the roles.
  const listRef = useRef<HTMLOListElement | null>(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.65 - r.top) / r.height));
      el.style.setProperty("--tp", p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Proportional strip: where each role sits between 2021 and today.
  const first = experience[experience.length - 1].start;
  const span = monthsBetween(first, null);
  const offset = (ym: string) => monthsBetween(first, ym) - 1;

  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <div className="wrap work__grid">
        <div className="work__head">
          <h2 id="work-title" className="kicker" data-reveal>
            Experience
          </h2>
          <p className="work__lead">
            {total} of professional engineering across four roles, React in every one of them.
          </p>
          <div className="span" data-reveal aria-label={`Career timeline from ${monthLabel(first)} to today`}>
            {experience.map((job) => (
              <span
                key={job.title + job.start}
                className={`span__seg ${job.end ? "" : "is-current"}`}
                style={{
                  left: `${(offset(job.start) / span) * 100}%`,
                  width: `${(monthsBetween(job.start, job.end) / span) * 100}%`,
                }}
                title={`${job.title}, ${job.company}`}
              />
            ))}
            <span className="span__label span__label--a">{first.slice(0, 4)}</span>
            <span className="span__label span__label--b">Today</span>
          </div>
        </div>

        <ol className="timeline" ref={listRef}>
          {experience.map((job, i) => {
            const months = monthsBetween(job.start, job.end);
            const isOpen = open.has(i);
            return (
              <li
                key={job.title + job.start}
                className={`${job.end ? "" : "is-current"} ${isOpen ? "is-open" : ""}`}
                data-reveal
              >
                <p className="timeline__when">
                  <time dateTime={job.start}>{monthLabel(job.start)}</time> to{" "}
                  {job.end ? <time dateTime={job.end}>{monthLabel(job.end)}</time> : "Present"}
                  <span className="timeline__dur">{durationLabel(months)}</span>
                </p>
                <div className="timeline__body">
                  <h3>
                    {job.title}
                    <span className="timeline__at">
                      {job.company}, {job.place}
                    </span>
                  </h3>
                  {job.clients && (
                    <p className="timeline__clients">
                      Clients: <strong>{job.clients.join(", ")}</strong>
                    </p>
                  )}
                  <ul className="timeline__points" id={`role-${i}`}>
                    {job.points.map((p, k) => (
                      <li key={p} className={k > 1 ? "is-extra" : ""}>
                        {p}
                      </li>
                    ))}
                  </ul>
                  {job.points.length > 2 && (
                    <button className="link-btn timeline__more" aria-expanded={isOpen} aria-controls={`role-${i}`} onClick={() => toggle(i)}>
                      {isOpen ? "Show less" : `Show ${job.points.length - 2} more`}
                    </button>
                  )}
                  <ul className="tags" aria-label="Technologies">
                    {job.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
