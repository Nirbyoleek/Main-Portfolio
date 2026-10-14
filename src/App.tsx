import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Contact from "./components/Contact";
import { person, stats } from "./data/content";
import { CountUp, useMagneticButtons, useRevealOnScroll } from "./lib/motion";

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
              <dd>
                <CountUp value={s.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default function App() {
  useRevealOnScroll();
  useMagneticButtons();
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
