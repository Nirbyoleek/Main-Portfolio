import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");
// The build writes a static hero into #root. Its intro animation has already
// played, so the React version should not play it a second time.
if (root.firstElementChild) document.documentElement.classList.add("has-shell");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
