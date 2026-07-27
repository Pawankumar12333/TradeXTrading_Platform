import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";  // ← index.css ki jagah App.css import karein
import App from "./App.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);