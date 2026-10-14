# Nirbyoleek Das — portfolio

An exploded-view portfolio: the hero takes an interface apart into its five layers
(data, logic, layout, style, motion) above the desk of a small 3D avatar, and
scrolling snaps them back into one finished screen.

Built with **React 19**, **three.js** and **Vite**. Every 3D object is code —
no model files, no paid tools, no external assets at runtime.

## What you can do on the page

| Where | Interaction |
| --- | --- |
| Hero | Hover a layer to lift it and read what it stands for. Drag to spin the stack. Scroll to collapse it into a screen (the camera dollies in). Click the avatar to make it wave and talk. It follows your cursor with its eyes and head. |
| Projects | A 3D turntable of project screens. Drag or swipe to spin, click a screen to bring it forward, or use the arrows and tabs. The front screen leans toward the cursor. |
| Skills | A 3D keyboard where every keycap is a skill. Hover or tap a key. Type a letter on your real keyboard to press the matching key; hit space for a wave across the board. |
| Contact | Form delivered through EmailJS (free tier), plus email, LinkedIn, GitHub and resume. |

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

Everything written on the site lives in **`src/data/content.js`** — intro, the five hero
layers, experience, projects, skills (keycaps) and the avatar's lines. The resume served
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
