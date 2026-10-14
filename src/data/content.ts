// Everything written on the site lives here, so updating the portfolio
// never means digging through components. Facts come from the 2026 resume.

export interface Person {
  firstName: string;
  lastName: string;
  role: string;
  headline: string;
  current: { title: string; company: string };
  location: string;
  email: string;
  phone: string;
  resume: string;
  links: { github: string; linkedin: string };
  updated: string;
}
export interface Stat {
  value: string;
  label: string;
}
export interface Strength {
  title: string;
  body: string;
}
export interface Layer {
  key: string;
  name: string;
  line: string;
}
export interface Impact {
  metric: string;
  change: string;
  /** New value as a percentage of the old one. */
  after: number;
  where: string;
  how: string;
}
export interface Role {
  company: string;
  title: string;
  place: string;
  /** YYYY-MM */
  start: string;
  /** YYYY-MM, or null while current */
  end: string | null;
  clients?: string[];
  tech: string[];
  points: string[];
}
export interface Project {
  id: string;
  name: string;
  client: string;
  type: "client" | "personal";
  status: string;
  /** Which canvas drawing the 3D screen shows; see three/mocks.ts. */
  mock: string;
  role: string;
  summary: string;
  highlights: string[];
  result: string;
  stack: string[];
  /** Live app or demo URL. */
  link?: string;
  /** Public source code URL. */
  repo?: string;
  /** Shown when there is no link or repo. */
  note?: string;
  /** Shown under the links, e.g. a cold-start warning. */
  linkNote?: string;
}
export interface Skill {
  label: string;
  /** Keycap width in key units. */
  w: number;
  tone: "ink" | "cobalt" | "paper" | "yellow";
  used: string;
}
export interface SkillGroup {
  name: string;
  items: { name: string; where: string[]; core?: boolean }[];
}

export const person: Person = {
  firstName: "Nirbyoleek",
  lastName: "Das",
  role: "Software Engineer",
  headline:
    "I build production web apps end to end for enterprise teams, from API design and data model to the interface and the release.",
  current: { title: "Application Engineer", company: "Tiger Analytics" },
  location: "India",
  email: "nirbyoleek152001@gmail.com",
  phone: "+91 79080 94747",
  resume: "Nirbyoleek-Das-Resume.pdf",
  links: {
    github: "https://github.com/Nirbyoleek",
    linkedin: "https://www.linkedin.com/in/nirbyoleek/",
  },
  updated: "October 2026",
};

// Headline numbers in the hero. Keep each one checkable against the resume.
export const stats: Stat[] = [
  { value: "2+", label: "years building production apps" },
  { value: "2", label: "global enterprise clients" },
  { value: "−40%", label: "document retrieval time at PepsiCo" },
  { value: "9.5", label: "GPA, B.Tech CSE" },
];

// What a hiring manager should remember, each backed by resume evidence.
export const strengths: Strength[] = [
  {
    title: "Frontend architecture",
    body: "I own the frontend architecture and API contracts for two Wolters Kluwer applications, and built the shared component and API-hook library that raised team delivery speed about 20%.",
  },
  {
    title: "APIs, auth and data",
    body: "I replaced ad-hoc permission checks with one authorisation layer, JWT with refresh-token rotation and role-based access, and cut API p95 latency 25% with indexing and query tuning.",
  },
  {
    title: "Performance and accessibility",
    body: "Route-level code splitting, memoised lists and image work made PepsiCo screens 30% faster. At Vakilsearch I rebuilt form validation, focus order and keyboard navigation.",
  },
];

// The five layers in the hero's 3D stack: the parts of a feature I own.
export const layers: Layer[] = [
  { key: "data", name: "Data", line: "Compound indexes and lean queries that cut API p95 by 25%." },
  { key: "logic", name: "Logic", line: "One shared auth layer: JWT with refresh rotation and role-based access." },
  { key: "layout", name: "Layout", line: "Route-level code splitting and memoised lists for 30% faster screens." },
  { key: "style", name: "Style", line: "A shared component and hook library that sped team delivery by 20%." },
  { key: "motion", name: "Motion", line: "Interfaces that respond to people, like this one." },
];

// Measured outcomes. `after` is the new value as a % of the old one.
export const impact: Impact[] = [
  { metric: "Document retrieval time", change: "−40%", after: 60, where: "PepsiCo Knowledge Management System", how: "Full-text search and metadata tagging" },
  { metric: "Page load time", change: "−30%", after: 70, where: "PepsiCo Support Load Portal", how: "Batched and de-duplicated API calls" },
  { metric: "API p95 response time", change: "−25%", after: 75, where: "Tiger Analytics client platforms", how: "Compound indexes, query tuning, leaner payloads" },
  { metric: "Team delivery speed", change: "+20%", after: 120, where: "Tiger Analytics team", how: "Shared component and API-hook library" },
];

// `start`/`end` are YYYY-MM; end null means current. Durations are computed.
export const experience: Role[] = [
  {
    company: "Tiger Analytics",
    title: "Application Engineer",
    place: "Chennai",
    start: "2024-08",
    end: null,
    clients: ["Wolters Kluwer", "PepsiCo"],
    tech: ["React", "TypeScript", "Node.js", "Express", "JWT", "RBAC"],
    points: [
      "Building two customer-facing applications for Wolters Kluwer in React, TypeScript and Node/Express, owning frontend architecture and API contracts from design through release.",
      "Shipped the PepsiCo Knowledge Management System for global teams; full-text search and metadata tagging cut document retrieval time 40%.",
      "Built shipment tracking for the PepsiCo Support Load Portal with real-time status, filtering and role-based dashboards; batching API calls cut page load ~30%.",
      "Cut API p95 response times 25% with compound indexing, query tuning and returning only the fields the client renders.",
      "Replaced ad-hoc permission checks with one shared authorisation layer, JWT with refresh-token rotation and RBAC, adopted across both platforms.",
      "Raised frontend performance 30% and team delivery speed ~20% with code splitting, memoised rendering and a shared component and API-hook library.",
    ],
  },
  {
    company: "Tiger Analytics",
    title: "Application Engineer Intern",
    place: "Chennai",
    start: "2024-01",
    end: "2024-07",
    tech: ["React", "Node.js", "Express", "Postman"],
    points: [
      "Built React dashboards over Node/Express APIs that automated client reporting previously assembled by hand.",
      "Wrote the first reusable UI components and API hooks the team later adopted, and standardised API work with shared Postman environments and request tests.",
    ],
  },
  {
    company: "Vakilsearch",
    title: "React.js Developer Intern",
    place: "Remote",
    start: "2022-05",
    end: "2022-09",
    tech: ["React", "Forms", "Accessibility"],
    points: [
      "Built responsive React components for legal-service workflows and reworked validation and accessibility (labels, focus order, keyboard navigation) to lift completion on multi-step forms.",
    ],
  },
  {
    company: "Trakiot Solutions",
    title: "ReactJS Software Engineer",
    place: "Remote",
    start: "2021-07",
    end: "2022-01",
    tech: ["React", "Tailwind CSS", "Routing", "State"],
    points: [
      "Sole frontend engineer on the flagship application; set the routing, state and API-integration conventions the team built on afterwards.",
    ],
  },
];

export const education = {
  school: "SRM Institute of Science and Technology",
  short: "SRM IST, Chennai",
  degree: "B.Tech, Computer Science & Engineering",
  years: "2020–2024",
  gpa: "9.5 / 10",
};

// `mock` picks which interface the 3D viewer draws for the project.
export const projects: Project[] = [
  {
    id: "wk",
    name: "Wolters Kluwer apps",
    client: "Tiger Analytics",
    type: "client",
    status: "In progress",
    mock: "wk",
    role: "Frontend architecture and API contracts",
    summary:
      "Two customer-facing applications I'm building now. I own the frontend architecture and the API contracts between the React client and the Node/Express services, from design through release.",
    highlights: ["Frontend architecture owned from design to release", "TypeScript on the client, Node/Express services"],
    result: "2 apps, architecture owned",
    stack: ["React", "TypeScript", "Node.js", "Express"],
  },
  {
    id: "kms",
    name: "PepsiCo Knowledge Management System",
    client: "Tiger Analytics",
    type: "client",
    status: "Shipped",
    mock: "kms",
    role: "Built and shipped the platform",
    summary:
      "An internal platform that gathers operational, training and process documentation for PepsiCo's global teams in one place.",
    highlights: ["Full-text search across all documentation", "Metadata tagging for training, ops and process docs"],
    result: "40% faster document retrieval",
    stack: ["React", "Node.js", "Express", "Full-text search"],
  },
  {
    id: "slp",
    name: "PepsiCo Support Load Portal",
    client: "Tiger Analytics",
    type: "client",
    status: "Shipped",
    mock: "slp",
    role: "Shipment tracking and dashboards",
    summary: "Shipment tracking with real-time status, advanced filtering and role-based dashboards.",
    highlights: ["Batched and de-duplicated API calls", "Role-based dashboards on the shared auth layer"],
    result: "~30% faster page loads",
    stack: ["React", "Node.js", "Express", "RBAC"],
  },
  {
    id: "chat",
    name: "Chat App",
    client: "Personal project",
    type: "personal",
    status: "Live",
    mock: "chat",
    role: "Solo, full stack",
    summary: "Real-time messaging with private rooms, typing indicators and message persistence.",
    highlights: ["JWT auth on sockets", "Per-socket rate limiting stops one client flooding a room"],
    result: "Real-time, rate-limited sockets",
    stack: ["Socket.io", "React", "Node.js", "MongoDB"],
    link: "https://chat-app-ymju.onrender.com",
  },
  {
    id: "matching-engine",
    name: "Order Matching Engine",
    client: "Personal project",
    type: "personal",
    status: "Live demo",
    mock: "book",
    role: "Solo: engine, server, benchmarks and trading UI",
    summary:
      "The core of an exchange: a single-symbol order book with price-time priority, built in TypeScript. A single-threaded, deterministic core is event-sourced, so every command is journalled before it is applied and a crash recovers by replay.",
    highlights: [
      "20,000 orders/s over WebSocket with p99 under 2 ms (352 µs at 10,000/s)",
      "Replays 1,000,000 commands in 0.64 s for crash recovery",
      "Limit, market, IOC, FOK, cancel and amend, with self-trade prevention and O(1) cancel",
      "332 tests including property and crash-recovery tests; 7 of 8 pre-set targets met",
    ],
    result: "20k orders/s, p99 < 2 ms",
    stack: ["TypeScript", "Node.js", "WebSockets", "React", "Event sourcing"],
    link: "https://matching-engine-demo.onrender.com/",
    // Add the repo URL as `repo` once the repository is public.
    linkNote: "Runs on a free server: the first visit can take about a minute to wake it. Source code available on request.",
  },
];

// Keycaps on the skills keyboard. `w` is the key width in units,
// `tone` picks the cap colour, `used` is shown when the key is pressed.
export const skills: Skill[] = [
  { label: "JavaScript", w: 1.5, tone: "ink", used: "Every role and project since 2021." },
  { label: "TypeScript", w: 1.5, tone: "cobalt", used: "Both Wolters Kluwer applications and my order matching engine." },
  { label: "React", w: 1, tone: "cobalt", used: "Every role: Trakiot, Vakilsearch and Tiger Analytics." },
  { label: "Next.js", w: 1, tone: "paper", used: "Server-rendered side builds and dashboards." },
  { label: "HTML", w: 1, tone: "paper", used: "Semantic, accessible markup: labels, focus order, landmarks." },
  { label: "CSS", w: 1, tone: "paper", used: "Responsive layouts, design tokens, motion." },

  { label: "Redux Toolkit", w: 1.75, tone: "paper", used: "Predictable app state for large React codebases." },
  { label: "React Query", w: 1.5, tone: "paper", used: "Server state, caching and request de-duplication." },
  { label: "Tailwind", w: 1.25, tone: "paper", used: "Fast, consistent UI, from Trakiot to side builds." },
  { label: "MUI", w: 1, tone: "paper", used: "Component-library dashboards." },
  { label: "A11y", w: 1, tone: "yellow", used: "Keyboard navigation and form accessibility work at Vakilsearch." },
  { label: "Perf", w: 1, tone: "yellow", used: "Code splitting, memoised lists, image optimisation: +30% frontend speed." },

  { label: "Node.js", w: 1.25, tone: "ink", used: "APIs for every client platform at Tiger Analytics." },
  { label: "Express", w: 1.25, tone: "paper", used: "REST services, middleware and centralised error handling." },
  { label: "REST APIs", w: 1.5, tone: "paper", used: "API design and contracts I own for Wolters Kluwer." },
  { label: "JWT + RBAC", w: 1.75, tone: "cobalt", used: "The shared auth layer adopted across both PepsiCo platforms." },
  { label: "Socket.io", w: 1.25, tone: "paper", used: "Real-time rooms and typing indicators in Chat App." },

  { label: "MongoDB", w: 1.5, tone: "paper", used: "Mongoose models, indexes and queries." },
  { label: "SQL", w: 1, tone: "paper", used: "Relational data and reporting queries." },
  { label: "Jest", w: 1, tone: "paper", used: "Tests for shared components and API hooks." },
  { label: "Postman", w: 1.25, tone: "paper", used: "Shared environments and request tests for the whole team." },
  { label: "Git", w: 1, tone: "ink", used: "Daily. Reviews, branches, clean history." },
  { label: "Vercel", w: 1.25, tone: "paper", used: "Deploys alongside Netlify and Render." },
];

// The skills matrix under the keyboard, grouped like the resume. `where`
// lists only places the resume shows the skill in use; leave it empty
// rather than guess.
export const skillGroups: SkillGroup[] = [
  {
    name: "Languages",
    items: [
      { name: "JavaScript", where: ["Tiger Analytics", "Vakilsearch", "Trakiot", "Projects"], core: true },
      { name: "TypeScript", where: ["Tiger Analytics", "Projects"], core: true },
      { name: "HTML5 and CSS3", where: ["Tiger Analytics", "Vakilsearch", "Trakiot"] },
      { name: "SQL", where: [] },
    ],
  },
  {
    name: "Frontend",
    items: [
      { name: "React", where: ["Tiger Analytics", "Vakilsearch", "Trakiot", "Projects"], core: true },
      { name: "Next.js", where: ["Projects"] },
      { name: "Redux Toolkit", where: ["Projects"] },
      { name: "Tailwind CSS", where: ["Trakiot", "Projects"] },
      { name: "React Query", where: [] },
      { name: "MUI", where: [] },
    ],
  },
  {
    name: "Backend and data",
    items: [
      { name: "Node.js and Express", where: ["Tiger Analytics", "Projects"], core: true },
      { name: "REST API design", where: ["Tiger Analytics", "Projects"], core: true },
      { name: "JWT auth and RBAC", where: ["Tiger Analytics", "Projects"] },
      { name: "MongoDB (Mongoose)", where: ["Projects"] },
      { name: "Socket.io and WebSockets", where: ["Projects"] },
    ],
  },
  {
    name: "Testing and tooling",
    items: [
      { name: "Git and GitHub", where: ["Tiger Analytics", "Vakilsearch", "Trakiot", "Projects"] },
      { name: "Postman", where: ["Tiger Analytics"] },
      { name: "Jest and Vitest", where: ["Projects"] },
      { name: "ESLint and Prettier", where: [] },
      { name: "Vercel, Netlify, Render", where: ["Projects"] },
    ],
  },
];

export const fundamentals: string[] = [
  "Data structures and algorithms",
  "API and schema design",
  "Caching",
  "Pagination",
  "Authorisation",
  "OWASP security practices",
];

// Lines the avatar says when you click it, in order.
export const avatarLines: string[] = [
  "Hi! I'm Nirbyoleek, a software engineer in India.",
  "Right now I'm building two apps for Wolters Kluwer.",
  "At PepsiCo I made document search 40% faster.",
  "I like shared foundations: one auth layer, one component library.",
  "My resume is one click away, top right.",
  "Okay, back to typing.",
];
