# Nirbyoleek Das — portfolio

A dark studio stage: my name set huge behind a realistic 3D avatar that looks at
your cursor, answers questions with lip-synced captions, and turns to watch the
layers of an interface (data, logic, layout, style, motion) snap into one finished
screen as you scroll.

Built with **React 19**, **TypeScript**, **three.js**, **TalkingHead** and **Vite**.
Free and open-source tools and assets only.

## What you can do on the page

| Where | Interaction |
| --- | --- |
| Hero | Name, current role, headline stats and one-click resume. A realistic 3D avatar follows the cursor with its eyes and head, blinks, breathes and shifts its weight. Ask it a question ("Who are you?", "What have you shipped?", "Your stack?", "Can we talk?") and it answers with lip-sync, hand gestures and live captions; it gives a thumbs-up when you download the resume. The layers of my work float beside it: hover one to read it, drag to spin, scroll to snap them into one screen. |
| About me | Story, an at-a-glance card for recruiters, three strengths backed by evidence, and measured results drawn as before/after bars. |
| Experience | Timeline with computed durations and total experience, a career strip since 2021, clients and tech per role. |
| Projects | A 3D turntable of project screens with filters (all, client, personal), my role, highlights, stack and live links. |
| Skills | A 3D keyboard where every keycap is a skill (type a letter to press it), plus a matrix of where each skill was used. |
| Contact | Email with copy button, phone, LinkedIn, GitHub, resume and an EmailJS form. |
| Anywhere | Press Ctrl+K (⌘K on Mac) for quick actions: resume, copy email, jump to a section. |

Mobile: touch works everywhere (tap layers, keys and screens; swipe the turntable),
layouts reflow, and WebGL pixel ratio is capped on touch devices. Respects
`prefers-reduced-motion`.

## The avatar

The hero avatar is a rigged, realistic 3D character animated in the browser by
[TalkingHead](https://github.com/met4citizen/TalkingHead) (MIT): idle motion,
blinking, eye contact, facial moods, hand gestures and lip-sync from ARKit and
viseme blend shapes. Speech is silent: each answer's words are turned into
mouth shapes and shown as captions, so nothing plays sound.

The model is **Male_Adult_20** from
[Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox) (MIT,
license in `public/avatar/LICENSE-rocketbox.txt`). `tools/rocketbox-to-glb.mjs`
converts it: it re-rigs the 3ds Max skeleton to the bone names and rest pose
TalkingHead expects, keeps the face blend shapes as sparse morph targets, shrinks
the textures and adds the glasses. The result is `public/avatar/avatar.glb`
(about 1 MB) plus a still, `public/avatar/avatar.webp`, used for the first paint
and on light devices. Any other Rocketbox character can be swapped in the same way.

Set `avatarModel` to `null` in `src/data/content.ts` to use the illustrated avatar
drawn in code instead.

## Motion

- **3D:** keys, screens, layers and the camera move on damped springs, so they
  overshoot slightly and settle. Pressing a key sends a ripple through its
  neighbours and a light follows it; the turntable keeps the momentum of a flick;
  a lifted layer gets a sweep of light; the avatar turns to watch the stack
  collapse as you scroll.
- **Stage:** a spotlight follows the pointer across the hero, the grid floor
  runs toward you, the glow behind the avatar breathes, and the name fades up
  and away as you scroll. Two bands of tech and clients cross below the hero.
- **Page:** the hero intro is one staggered sequence; section titles open from
  condensed to full width; stats count up; result bars grow; the timeline draws
  as you scroll; project details slide in from the side you moved toward; the
  nav's active pill glides between links; main buttons lean toward the cursor.
- **Respectful:** all of it switches off under `prefers-reduced-motion`, and no
  content is hidden before JavaScript runs.

## Performance

- **The hero is static HTML.** The build writes the name, headline, stats and resume
  button into `index.html` (`src/lib/shell.ts`), so they paint before any JavaScript runs.
- **three.js loads later, as its own chunk.** Each 3D scene is a dynamic `import()`,
  started after the first paint (hero) or when its section nears the viewport.
- **No shadow maps.** Soft shadows are textured decals, which look softer and cost
  far less than extra render passes.
- **Adaptive resolution.** If frames slow down, the 3D renders fewer pixels; when
  they speed up again it steps back up.
- **Light devices get a static version.** Data-saver mode, 2G, very low memory, no
  WebGL, or `?lite` in the URL skip three.js entirely and show a still of the avatar
  and flat project screens instead.
- **The avatar loads after the page.** The 1 MB model and TalkingHead load in their
  own chunk once the hero has painted, behind a still of the same pose.

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

Everything written on the site lives in **`src/data/content.ts`**: headline, stats,
strengths, results, experience (durations are computed from the dates), projects,
skills, and the avatar's lines and answers (`avatarQA`). The resume served
by the "Resume" buttons is `public/Nirbyoleek-Das-Resume.pdf`.

EmailJS IDs are at the top of `src/components/Contact.tsx`.

## Structure

```
src/
  data/content.ts        all copy, typed
  components/            React sections (Nav, Hero, Marquee, About, Experience, Projects, Skills, Contact)
  lib/                   pure code: dates and durations, maths, 2D drawings, the static hero
  three/stage.ts         renderer wrapper: sizing, pointer, pause when off-screen
  three/proAvatar.ts     the realistic avatar: TalkingHead setup, gaze, gestures, silent lip-sync
  three/avatar.ts        the illustrated fallback avatar (look-at, blink, typing, wave)
  three/heroScene.ts     exploded layer stack
  three/projectsScene.ts project turntable
  three/keyboardScene.ts skills keyboard
  three/textures.ts      turns the 2D drawings into textures
  styles.css             tokens and layout
test/                    unit tests for helpers, content and the static hero
tools/                   avatar converter (not part of the build)
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

- Archivo typeface by Omnibus-Type, SIL Open Font License (`src/assets/ARCHIVO-OFL.txt`).
- Avatar: Microsoft Rocketbox, MIT (`public/avatar/LICENSE-rocketbox.txt`).
- Avatar animation: TalkingHead by Mika Suominen, MIT.
