import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Experience from "./components/Experience.jsx";
import Projects from "./components/Projects.jsx";
import Skills from "./components/Skills.jsx";
import Contact from "./components/Contact.jsx";
import { person, stats } from "./data/content.js";

// On phones the hero keeps only name and actions, so the headline and
// numbers follow directly after it.
function MobileStats() {
  return (
    <section className="mobile-stats" aria-label="Summary">
      <div className="wrap">
        <p>
          <strong>{person.role}.</strong> {person.headline}
        </p>
        <dl>
          {stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <Hero />
      <main id="main">
        <MobileStats />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Contact />
      </main>
    </>
  );
}
