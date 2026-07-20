import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import FeedbackForm from "./pages/FeedbackForm";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { auth } from "./lib/api";

// Redirects to login if there is no stored admin token.
function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!auth.isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedbackForm />} />
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
