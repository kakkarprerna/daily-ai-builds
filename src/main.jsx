import React from "react";
import { createRoot } from "react-dom/client";
import SignalTranslator from "./SignalTranslator.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SignalTranslator />
  </React.StrictMode>
);
