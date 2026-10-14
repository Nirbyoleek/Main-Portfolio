# Nirbyoleek Das — portfolio

An exploded-view portfolio: the hero takes an interface apart into its five layers
(data, logic, layout, style, motion) above the desk of a small 3D avatar, and
scrolling snaps them back into one finished screen.

Built with **React 19**, **TypeScript**, **three.js** and **Vite**. Every 3D object is
code: no model files, no paid tools.

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
`prefers-reduced-motion`.

## Performance

- **The hero is static HTML.** The build writes the name, headline, stats and resume
  button into `index.html` (`src/lib/shell.ts`), so they paint before any JavaScript runs.
- **three.js loads later, as its own chunk.** Each 3D scene is a dynamic `import()`,
  started after the first paint (hero) or when its section nears the viewport.
- **Light devices get a static version.** Data-saver mode, 2G, very low memory, no
  WebGL, or `?lite` in the URL skip three.js entirely and show a still of the avatar
  and flat project screens instead.

In a local test on a throttled phone profile (4× CPU slowdown, 1.6 Mbps, 150 ms latency),
first contentful paint went
from about 5.8 s to about 0.35 s, and the JavaScript needed for it from 834 KB to 252 KB
(uncompressed).

## Sharing and search

`index.html` carries Open Graph and Twitter tags with a 1200×630 preview image
(`public/og-image.png`), a canonical URL, and a schema.org `Person` record. The build
also writes `robots.txt` and `sitemap.xml`. The site URL comes from Netlify's `URL`
variable; set `SITE_URL` to override it (for a custom domain).

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs to dist/
npm run preview
npm run typecheck # tsc, strict
npm test          # vitest
npm run check     # all three, as CI runs them
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
  data/content.ts        all copy, typed
  components/            React sections (Nav, Hero, About, Experience, Projects, Skills, Contact)
  lib/                   pure code: dates and durations, maths, 2D drawings, the static hero
  three/stage.ts         renderer wrapper: sizing, pointer, pause when off-screen
  three/avatar.ts        the procedural avatar (look-at, blink, typing, wave)
  three/heroScene.ts     exploded layer stack + avatar
  three/projectsScene.ts project turntable
  three/keyboardScene.ts skills keyboard
  three/textures.ts      turns the 2D drawings into textures
  styles.css             tokens and layout
test/                    unit tests for helpers, content and the static hero
```

## Checks

GitHub Actions runs `typecheck`, `test` and `build` on every push and pull request
(`.github/workflows/ci.yml`) and posts bundle sizes in the run summary.

## Deploy

Hosted on **Netlify**. `netlify.toml` holds the build settings (Node 22,
`npm run build`, publish `dist`), so linking the repo in Netlify is all that's
needed; every push to `main` redeploys.

The build uses relative asset paths, so `dist/` also works on any other static host.

## Credits

Archivo typeface by Omnibus-Type, SIL Open Font License (`src/assets/ARCHIVO-OFL.txt`).
