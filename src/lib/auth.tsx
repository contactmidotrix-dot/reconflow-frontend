import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, clearToken, getToken, setToken } from "./api";

export type UserRole = "OWNER" | "FINANCE_MANAGER" | "ACCOUNTANT" | "OPS_MANAGER" | "AUDITOR";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  /** True once we've checked for an existing session on load - lets the
   * app show nothing (rather than a login-page flash) while that check
   * is in flight. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // A token surviving a page reload (same tab, sessionStorage) doesn't
    // carry the user object with it - rehydrate it here, which doubles
    // as validating the token still works before assuming we're logged in.
    const existingToken = getToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }
    apiFetch<User>("/auth/me")
      .then(setUser)
      .catch(() => {
        // apiFetch already clears the token and redirects on a 401;
        // anything else, treat as logged out rather than stuck loading.
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(token);
    setUser(loggedInUser);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
