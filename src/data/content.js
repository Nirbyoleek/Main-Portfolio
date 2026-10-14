// Everything written on the site lives here, so updating the portfolio
// never means digging through components.

export const person = {
  firstName: "Nirbyoleek",
  lastName: "Das",
  role: "Software engineer",
  intro:
    "I build production web apps end to end — API contracts, data models, interfaces and the release — for enterprise teams at PepsiCo and Wolters Kluwer.",
  location: "India",
  email: "nirbyoleek152001@gmail.com",
  phone: "+91 79080 94747",
  resume: "Nirbyoleek-Das-Resume.pdf",
  links: {
    github: "https://github.com/Nirbyoleek",
    linkedin: "https://www.linkedin.com/in/nirbyoleek/",
  },
};

// The five layers shown in the hero's exploded view. Each one is a layer of
// the work Nirbyoleek actually owns on a feature, bottom to top.
export const layers = [
  {
    key: "data",
    name: "Data",
    line: "Compound indexes and lean queries that cut API p95 by 25%.",
  },
  {
    key: "logic",
    name: "Logic",
    line: "One shared auth layer: JWT with refresh rotation and role-based access.",
  },
  {
    key: "layout",
    name: "Layout",
    line: "Route-level code splitting and memoised lists for 30% faster screens.",
  },
  {
    key: "style",
    name: "Style",
    line: "A shared component and hook library that sped team delivery by 20%.",
  },
  {
    key: "motion",
    name: "Motion",
    line: "Interfaces that respond — like this one. Drag it, click me, scroll on.",
  },
];

export const experience = [
  {
    company: "Tiger Analytics",
    title: "Application Engineer",
    place: "Chennai",
    start: "Aug 2024",
    end: "Present",
    points: [
      "Building two customer-facing applications for Wolters Kluwer in React, TypeScript and Node/Express, owning frontend architecture and API contracts from design through release.",
      "Cut API p95 response times 25% with compound indexing, query tuning and returning only the fields the client renders.",
      "Replaced ad-hoc permission checks with one shared authorisation layer — JWT with refresh-token rotation and RBAC — adopted across both PepsiCo platforms.",
      "Improved frontend performance 30% and raised team delivery speed ~20% by extracting a shared component and API-hook library.",
    ],
  },
  {
    company: "Tiger Analytics",
    title: "Application Engineer Intern",
    place: "Chennai",
    start: "Jan 2024",
    end: "Jul 2024",
    points: [
      "Built React dashboards over Node/Express APIs that automated client reporting previously assembled by hand.",
      "Wrote the first reusable UI components and API hooks the team later adopted, and standardised API work with shared Postman environments.",
    ],
  },
  {
    company: "Vakilsearch",
    title: "React.js Developer Intern",
    place: "Remote",
    start: "May 2022",
    end: "Sep 2022",
    points: [
      "Built responsive React components for legal-service workflows and reworked validation and accessibility — labels, focus order, keyboard navigation — to lift completion on multi-step forms.",
    ],
  },
  {
    company: "Trakiot Solutions",
    title: "ReactJS Software Engineer",
    place: "Remote",
    start: "Jul 2021",
    end: "Jan 2022",
    points: [
      "Sole frontend engineer on the flagship application; set the routing, state and API-integration conventions the team built on afterwards.",
    ],
  },
];

// `mock` picks which interface the 3D viewer draws for the project.
export const projects = [
  {
    id: "wk",
    name: "Wolters Kluwer apps",
    client: "Tiger Analytics, current",
    kind: "Client work",
    mock: "wk",
    summary:
      "Two customer-facing applications I'm building now. I own the frontend architecture and the API contracts between the React client and the Node/Express services, from design through release.",
    result: "2 apps, frontend architecture owned",
    stack: ["React", "TypeScript", "Node.js", "Express"],
  },
  {
    id: "kms",
    name: "PepsiCo Knowledge Management System",
    client: "Tiger Analytics",
    kind: "Client work",
    mock: "kms",
    summary:
      "An internal platform that gathers operational, training and process documentation for PepsiCo's global teams in one place, with full-text search and metadata tagging.",
    result: "40% faster document retrieval",
    stack: ["React", "Node.js", "Express", "Full-text search"],
  },
  {
    id: "slp",
    name: "PepsiCo Support Load Portal",
    client: "Tiger Analytics",
    kind: "Client work",
    mock: "slp",
    summary:
      "Shipment tracking with real-time status, advanced filtering and role-based dashboards. Batching and de-duplicating API calls made every screen lighter to load.",
    result: "~30% faster page loads",
    stack: ["React", "Node.js", "Express", "RBAC"],
  },
  {
    id: "chat",
    name: "Chat App",
    client: "Personal project",
    kind: "Side build",
    mock: "chat",
    summary:
      "Real-time messaging with private rooms, typing indicators and message persistence. JWT auth plus per-socket rate limiting keeps one noisy client from flooding a room.",
    result: "Real-time, rate-limited sockets",
    stack: ["Socket.io", "React", "Node.js", "MongoDB"],
    link: "https://chat-app-ymju.onrender.com",
  },
  {
    id: "twitter",
    name: "Twitter Clone",
    client: "Personal project",
    kind: "Side build",
    mock: "twitter",
    summary:
      "Feed, follows and posting on a paginated REST API, with response caching and centralised server-side error handling.",
    result: "Paginated, cached REST API",
    stack: ["React", "Node.js", "Express", "MongoDB"],
    link: "https://twitter-n5yl.onrender.com/",
  },
];

// Keycaps on the skills keyboard. `w` is the key width in units,
// `tone` picks the cap colour, `used` is shown when the key is pressed.
export const skills = [
  { label: "JavaScript", w: 1.5, tone: "ink", used: "Every project since 2021." },
  { label: "TypeScript", w: 1.5, tone: "cobalt", used: "Both Wolters Kluwer applications." },
  { label: "React", w: 1, tone: "cobalt", used: "Every role — from Trakiot's flagship app to PepsiCo and Wolters Kluwer." },
  { label: "Next.js", w: 1, tone: "paper", used: "Server-rendered side builds and dashboards." },
  { label: "HTML", w: 1, tone: "paper", used: "Semantic, accessible markup — labels, focus order, landmarks." },
  { label: "CSS", w: 1, tone: "paper", used: "Responsive layouts, design tokens, motion." },

  { label: "Redux Toolkit", w: 1.75, tone: "paper", used: "Predictable app state for large React codebases." },
  { label: "React Query", w: 1.5, tone: "paper", used: "Server state, caching and request de-duplication." },
  { label: "Tailwind", w: 1.25, tone: "paper", used: "Fast, consistent UI on side builds." },
  { label: "MUI", w: 1, tone: "paper", used: "Enterprise dashboards with a shared component library." },
  { label: "A11y", w: 1, tone: "yellow", used: "Keyboard navigation and form accessibility work at Vakilsearch." },
  { label: "Perf", w: 1, tone: "yellow", used: "Code splitting, memoised lists, image optimisation: +30% frontend speed." },

  { label: "Node.js", w: 1.25, tone: "ink", used: "APIs for every client platform at Tiger Analytics." },
  { label: "Express", w: 1.25, tone: "paper", used: "REST services, middleware and centralised error handling." },
  { label: "REST APIs", w: 1.5, tone: "paper", used: "API design and contracts I own for Wolters Kluwer." },
  { label: "JWT + RBAC", w: 1.75, tone: "cobalt", used: "The shared auth layer adopted across both PepsiCo platforms." },
  { label: "Socket.io", w: 1.25, tone: "paper", used: "Real-time rooms and typing indicators in Chat App." },

  { label: "MongoDB", w: 1.5, tone: "paper", used: "Compound indexes and query tuning: API p95 down 25%." },
  { label: "SQL", w: 1, tone: "paper", used: "Relational data and reporting queries." },
  { label: "Jest", w: 1, tone: "paper", used: "Tests for shared components and API hooks." },
  { label: "Postman", w: 1.25, tone: "paper", used: "Shared environments and request tests for the whole team." },
  { label: "Git", w: 1, tone: "ink", used: "Daily. Reviews, branches, clean history." },
  { label: "Vercel", w: 1.25, tone: "paper", used: "Deploys alongside Netlify and Render." },
];

export const education = {
  school: "SRM Institute of Science and Technology",
  degree: "B.Tech, Computer Science & Engineering",
  years: "2020–2024",
  gpa: "9.5 / 10",
};

// Lines the avatar says when you click it, in order.
export const avatarLines = [
  "Hi, I'm Nirbyoleek. Drag the layers around.",
  "Every layer here is something I own on a feature.",
  "Scroll down and they snap into one screen.",
  "Yes, I built this with three.js.",
  "Ok, you can stop clicking me now.",
  "Fine. One more wave.",
];
