import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth
} from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

const AuthContext = createContext(null);

async function authRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const existingToken = getStoredToken();

        if (!existingToken) {
          setLoading(false);
          return;
        }

        const data = await authRequest("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${existingToken}`
          }
        });

        setToken(existingToken);
        setUser(data.user);
      } catch {
        clearStoredAuth();
        setToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function login(email, password) {
    const data = await authRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    setStoredAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload) {
    const data = await authRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setStoredAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearStoredAuth();
    setToken("");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
