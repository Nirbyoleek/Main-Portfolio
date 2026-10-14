import { experience } from "../data/content.js";

export default function Experience() {
  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <div className="wrap work__grid">
        <div className="work__head">
          <h2 id="work-title" className="kicker">
            Work
          </h2>
          <p className="work__lead">React since 2021, across four teams. The through-line: make the next feature cheaper to build.</p>
        </div>
        <ol className="timeline">
          {experience.map((job) => (
            <li key={job.title + job.start} className={job.end === "Present" ? "is-current" : ""}>
              <p className="timeline__when">
                <time>{job.start}</time> to <time>{job.end}</time>
              </p>
              <div className="timeline__body">
                <h3>
                  {job.title}
                  <span className="timeline__at">
                    {job.company}, {job.place}
                  </span>
                </h3>
                <ul>
                  {job.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
