import * as React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary.tsx";
import { initAdminSentry } from "./lib/sentry";
import "./index.css";

// Initialize Sentry error and performance monitoring for Admin Portal
initAdminSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
