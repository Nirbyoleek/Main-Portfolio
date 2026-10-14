import { useState } from "react";
import { person } from "../data/content.js";

// EmailJS (free tier) delivers the form to Nirbyoleek's inbox without a
// backend. These IDs are public by design; change them in one place here.
const EMAILJS = {
  service: "my_portfolio",
  template: "template_eolpd3v",
  publicKey: "dKwis_E89r_khbUbw",
};

export default function Contact() {
  const [status, setStatus] = useState({ kind: "idle", text: "" });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus({ kind: "sending", text: "Sending…" });
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS.service,
          template_id: EMAILJS.template,
          user_id: EMAILJS.publicKey,
          template_params: data,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      form.reset();
      setStatus({ kind: "sent", text: "Message sent. I'll reply to the email you gave." });
    } catch {
      setStatus({
        kind: "error",
        text: `The message didn't send. Email me directly at ${person.email}.`,
      });
    }
  }

  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap contact__grid">
        <div>
          <h2 id="contact-title" className="kicker">
            Contact
          </h2>
          <p className="contact__lead">Have a role or a product that needs building? Write to me.</p>
          <a className="contact__email" href={`mailto:${person.email}`}>
            {person.email.split("@")[0]}
            <wbr />@{person.email.split("@")[1]}
          </a>
          <ul className="contact__links">
            <li>
              <a href={person.links.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={person.links.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href={`./${person.resume}`} download>
                Resume (PDF)
              </a>
            </li>
          </ul>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label>
            <span>Your name</span>
            <input name="user_name" autoComplete="name" required />
          </label>
          <label>
            <span>Your email</span>
            <input name="user_email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Message</span>
            <textarea name="message" rows="5" required />
          </label>
          <div className="form__foot">
            <button className="btn btn--primary" type="submit" disabled={status.kind === "sending"}>
              {status.kind === "sending" ? "Sending…" : "Send message"}
            </button>
            <p className={`form__status form__status--${status.kind}`} role="status">
              {status.text}
            </p>
          </div>
        </form>
      </div>

      <footer className="footer wrap">
        <p>© {new Date().getFullYear()} Nirbyoleek Das</p>
        <p>Built with React and three.js. Every 3D object on this page is code, no model files.</p>
        <a href="#top">Back to top</a>
      </footer>
    </section>
  );
}
