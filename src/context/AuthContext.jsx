import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredAuth, 
  getStoredToken,
  getStoredUser,
  setStoredAuth,
} from "../lib/auth";
import { hasPlanAccess, normalizePlan } from "../lib/plan";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

const AuthContext = createContext(null);

async function authRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data;
}

function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,
    firm_id:
      user.firm_id ||
      user.firmId ||
      user.firm?.id ||
      user.organization_id ||
      null,
    role: user.role || "user",
    plan_tier: normalizePlan(
      user.plan_tier ||
        user.planTier ||
        user.plan ||
        user.subscription_plan ||
        user.firm?.plan_tier
    ),
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken() || "");
  const [user, setUser] = useState(normalizeUser(getStoredUser()));
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
            Authorization: `Bearer ${existingToken}`,
          },
        });

        const normalizedUser = normalizeUser(data.user);

        setStoredAuth(existingToken, normalizedUser);
        setToken(existingToken);
        setUser(normalizedUser);
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
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
      body: JSON.stringify({ email, password }),
    });

    const normalizedUser = normalizeUser(data.user);

    setStoredAuth(data.token, normalizedUser);
    setToken(data.token);
    setUser(normalizedUser);

    return normalizedUser;
  }

  async function signup(payload) {
    const data = await authRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const normalizedUser = normalizeUser(data.user);

    setStoredAuth(data.token, normalizedUser);
    setToken(data.token);
    setUser(normalizedUser);

    return normalizedUser;
  }

  async function refreshMe() {
    if (!token) return null;

    const data = await authRequest("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const normalizedUser = normalizeUser(data.user);

    setStoredAuth(token, normalizedUser);
    setUser(normalizedUser);

    return normalizedUser;
  }

  function logout() {
    clearStoredAuth();
    setToken("");
    setUser(null);
  }

  function canAccess(requiredPlan) {
    return hasPlanAccess(user?.plan_tier, requiredPlan);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      firmId: user?.firm_id || null,
      role: user?.role || null,
      planTier: user?.plan_tier || "free",
      login,
      signup,
      logout,
      refreshMe,
      canAccess,
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
