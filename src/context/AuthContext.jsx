import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
} from "../lib/auth";
import { hasPlanAccess, normalizePlan } from "../lib/plan";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

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
    let active = true;

    async function bootstrap() {
      try {
        const existingToken = getStoredToken();

        if (!existingToken) {
          if (active) setLoading(false);
          return;
        }

        const data = await authApi.me();
        const normalizedUser = normalizeUser(data?.user || data);

        if (!normalizedUser) {
          throw new Error("Unable to load authenticated user");
        }

        setStoredAuth(existingToken, normalizedUser);

        if (!active) return;

        setToken(existingToken);
        setUser(normalizedUser);
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
        clearStoredAuth();

        if (!active) return;

        setToken("");
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function login(emailOrPayload, passwordArg) {
    const payload =
      typeof emailOrPayload === "object" && emailOrPayload !== null
        ? emailOrPayload
        : { email: emailOrPayload, password: passwordArg };

    const data = await authApi.login(payload);
    const normalizedUser = normalizeUser(data?.user);

    if (!data?.token) {
      throw new Error("Login response did not include a token");
    }

    setStoredAuth(data.token, normalizedUser);
    setToken(data.token);
    setUser(normalizedUser);

    return normalizedUser;
  }

  async function signup(payload) {
    const data = await authApi.signup(payload);
    const normalizedUser = normalizeUser(data?.user);

    if (!data?.token) {
      throw new Error("Signup response did not include a token");
    }

    setStoredAuth(data.token, normalizedUser);
    setToken(data.token);
    setUser(normalizedUser);

    return normalizedUser;
  }

  async function refreshMe() {
    const existingToken = getStoredToken();

    if (!existingToken) return null;

    const data = await authApi.me();
    const normalizedUser = normalizeUser(data?.user || data);

    setStoredAuth(existingToken, normalizedUser);
    setToken(existingToken);
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
