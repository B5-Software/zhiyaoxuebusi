import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/zcool-kuaile";
import "./index.css";
import "./responsive.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline caching is optional; an unsupported browser can still play online.
    });
  });
}
