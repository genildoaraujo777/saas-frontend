import React from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./routes/Routes";
import RootLayout from "./pages/_layout";
import './main.css';

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Elemento #root não encontrado em index.html");

createRoot(rootEl).render(
  <React.StrictMode>
    <RootLayout>
      <AppRoutes />
    </RootLayout>
  </React.StrictMode>
);