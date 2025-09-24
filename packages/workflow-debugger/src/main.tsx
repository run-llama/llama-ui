import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Apply dark mode based on system preference
function applySystemTheme() {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", isDark);
}

// Apply theme immediately to prevent flash
applySystemTheme();

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", applySystemTheme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
