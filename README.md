# Nirbyoleek Das — portfolio

An exploded-view portfolio: the hero takes an interface apart into its five layers
(data, logic, layout, style, motion) above the desk of a small 3D avatar, and
scrolling snaps them back into one finished screen.

Built with **React 19**, **three.js** and **Vite**. Every 3D object is code —
no model files, no paid tools, no external assets at runtime.

## What you can do on the page

| Where | Interaction |
| --- | --- |
| Hero | Name, current role, open-to roles, headline stats and one-click resume. A 3D avatar of me (glasses, hoodie, headphones) follows the cursor with eyes and head, types, glances at the laptop when you stop moving, and waves and talks when clicked. The layers of my work float above the desk: hover one to read it, drag to spin, scroll to snap them into one screen. |
| About me | Story, an at-a-glance card for recruiters, three strengths backed by evidence, and measured results drawn as before/after bars. |
| Experience | Timeline with computed durations and total experience, a career strip since 2021, clients and tech per role. |
| Projects | A 3D turntable of project screens with filters (all, client, personal), my role, highlights, stack and live links. |
| Skills | A 3D keyboard where every keycap is a skill (type a letter to press it), plus a matrix of where each skill was used. |
| Contact | Email with copy button, phone, open-to roles, LinkedIn, GitHub, resume and an EmailJS form. |
| Anywhere | Press Ctrl+K (⌘K on Mac) for quick actions: resume, copy email, jump to a section. |

Mobile: touch works everywhere (tap layers, keys and screens; swipe the turntable),
layouts reflow, and WebGL pixel ratio is capped on touch devices. Respects
`prefers-reduced-motion`. If WebGL is unavailable the page still works without the 3D views.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs to dist/
npm run preview
```

## Edit the content

Everything written on the site lives in **`src/data/content.js`**: headline, stats,
strengths, results, experience (durations are computed from the dates), projects,
skills and the avatar's lines. Set `openTo` to `""` to hide the open-to-roles badge. The resume served
by the "Resume" buttons is `public/Nirbyoleek-Das-Resume.pdf`.

EmailJS IDs are at the top of `src/components/Contact.jsx`.

## Structure

```
src/
  data/content.js        all copy
  components/            React sections (Nav, Hero, About, Experience, Projects, Skills, Contact)
  three/stage.js         renderer wrapper: sizing, pointer, pause when off-screen
  three/avatar.js        the procedural avatar (look-at, blink, typing, wave)
  three/heroScene.js     exploded layer stack + avatar
  three/projectsScene.js project turntable
  three/keyboardScene.js skills keyboard
  three/mocks.js         canvas-drawn UI textures for layers, screens and keycaps
  styles.css             tokens and layout
```

## Deploy

The build uses relative asset paths, so `dist/` works on any static host.

- **GitHub Pages:** push to `main`. The workflow in `.github/workflows/deploy.yml`
  builds and publishes. In the repo, open Settings → Pages and set Source to
  "GitHub Actions" once.
- **Netlify / Vercel:** import the repo; build command `npm run build`, output `dist`.

## Credits

Archivo typeface by Omnibus-Type, SIL Open Font License (`src/assets/ARCHIVO-OFL.txt`).
