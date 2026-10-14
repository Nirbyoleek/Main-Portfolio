import { education, person } from "../data/content.js";

// Measured outcomes from the resume, written like a diff: what went down,
// what went up.
const impact = [
  { sign: "−", value: "40%", what: "document retrieval time", where: "PepsiCo Knowledge Management System" },
  { sign: "−", value: "30%", what: "page load time", where: "PepsiCo Support Load Portal" },
  { sign: "−", value: "25%", what: "API p95 response time", where: "indexing and query tuning" },
  { sign: "+", value: "20%", what: "team delivery speed", where: "shared component and API-hook library" },
];

export default function About() {
  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="wrap about__grid">
        <div className="about__lead">
          <h2 id="about-title" className="kicker">
            About
          </h2>
          <p className="about__statement">
            I own features from the database index to the hover state. Most of my work is enterprise
            software, so I care about the parts users never see as much as the parts they do.
          </p>
          <p className="about__body">
            Since 2021 I've shipped React applications at Trakiot and Vakilsearch and, now at Tiger
            Analytics, for PepsiCo and Wolters Kluwer. I like shared foundations: one auth
            layer, one component library, one way to call the API, so a team moves faster every sprint.
          </p>
        </div>

        <dl className="facts">
          <div>
            <dt>Now</dt>
            <dd>Application Engineer, Tiger Analytics</dd>
          </div>
          <div>
            <dt>Clients</dt>
            <dd>PepsiCo, Wolters Kluwer</dd>
          </div>
          <div>
            <dt>Studied</dt>
            <dd>
              {education.degree}, SRM, GPA {education.gpa}
            </dd>
          </div>
          <div>
            <dt>Based in</dt>
            <dd>{person.location}</dd>
          </div>
        </dl>
      </div>

      <div className="wrap">
        <h3 className="impact__title">Changes I've shipped, measured</h3>
        <ul className="impact">
          {impact.map((d) => (
            <li key={d.what} className={d.sign === "+" ? "is-up" : "is-down"}>
              <span className="impact__sign" aria-hidden="true">
                {d.sign}
              </span>
              <span className="impact__value">
                <span className="sr-only">{d.sign === "+" ? "up " : "down "}</span>
                {d.value}
              </span>
              <span className="impact__what">{d.what}</span>
              <span className="impact__where">{d.where}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
