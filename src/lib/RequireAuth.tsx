import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Checking sessionStorage/`GET /auth/me` on first load - deliberately
    // blank rather than flashing the login page for a logged-in user
    // whose token just hasn't been confirmed yet.
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
