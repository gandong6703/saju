import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./react-badge.css";

const rootElement = document.getElementById("react-root");

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
