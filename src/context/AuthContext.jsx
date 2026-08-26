import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { enrichUserWithPermissions } from "../lib/permissions.js";
import {
  canAccessRoute as evaluateRouteAccess,
  canViewAdvancedNavigation,
  getEntitlementsForPlan,
  getUserAccessLevel,
  isAdministrator as evaluateAdministrator,
  isExecutiveUser as evaluateExecutiveUser,
  isPlatformAdmin as evaluatePlatformAdmin,
  normalizePlan,
} from "../lib/entitlements.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "vs_token";
const USER_KEY = "vs_user";

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return enrichUserWithPermissions(JSON.parse(raw));
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setStoredAuth(token, user) {
  if (typeof window === "undefined") return;

  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);

  if (user) localStorage.setItem(USER_KEY, JSON.stringify(enrichUserWithPermissions(user)));
  else localStorage.removeItem(USER_KEY);
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function normalizeAuthResponse(data = {}) {
  const token = data?.token || "";
  const firm = data?.firm || null;
  const user = data?.user
    ? enrichUserWithPermissions({
        ...data.user,
        firm: data.user?.firm || firm || null,
      })
    : null;

  return { token, user, firm };
}

const EMPTY_ENTITLEMENTS = {
  entitlements: [],
  limits: {},
  usage: {},
  build: "",
  plan: "",
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [entitlementState, setEntitlementState] = useState(EMPTY_ENTITLEMENTS);

  const loadEntitlements = useCallback(async (activeToken, activeUser) => {
    if (!activeToken) return null;

    try {
      const response = await api.get("/entitlements/me", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const next = response?.data || null;
      if (next) setEntitlementState(next);
      return next;
    } catch (error) {
      console.warn("Entitlement refresh failed; using plan fallback:", error?.message);
      const fallbackPlan = normalizePlan(
        activeUser?.plan_tier || activeUser?.firm?.plan_tier || "free"
      );
      setEntitlementState((current) => ({
        ...current,
        plan: fallbackPlan,
        entitlements: getEntitlementsForPlan(fallbackPlan),
      }));
      return null;
    }
  }, []);

  const applyAuth = useCallback((nextToken, nextUser) => {
    const enrichedUser = nextUser ? enrichUserWithPermissions(nextUser) : null;
    setToken(nextToken || "");
    setUser(enrichedUser);
    setStoredAuth(nextToken || "", enrichedUser);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken("");
    setUser(null);
    setEntitlementState(EMPTY_ENTITLEMENTS);
  }, []);

  const refreshMe = useCallback(async () => {
    const activeToken = token || getStoredToken();
    if (!activeToken) {
      logout();
      return null;
    }

    const response = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const me = response?.data || null;
    if (!me) {
      logout();
      return null;
    }

    applyAuth(activeToken, me);
    await loadEntitlements(activeToken, me);
    return enrichUserWithPermissions(me);
  }, [applyAuth, loadEntitlements, logout, token]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      if (storedUser && isMounted) setUser(storedUser);

      try {
        const response = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const me = response?.data || null;
        if (!me) {
          logout();
          return;
        }

        if (isMounted) {
          applyAuth(storedToken, me);
          await loadEntitlements(storedToken, me);
        }
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
        if (isMounted) logout();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [applyAuth, loadEntitlements, logout]);

  const login = useCallback(async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token: nextToken, user: nextUser } = normalizeAuthResponse(response?.data || {});
    if (!nextToken || !nextUser) throw new Error("Login response missing token or user.");

    applyAuth(nextToken, nextUser);
    await loadEntitlements(nextToken, nextUser);
    return { token: nextToken, user: nextUser };
  }, [applyAuth, loadEntitlements]);

  const signup = useCallback(async (payload) => {
    const response = await api.post("/auth/signup", payload);
    const { token: nextToken, user: nextUser, firm } = normalizeAuthResponse(response?.data || {});
    if (!nextToken || !nextUser) throw new Error("Signup response missing token or user.");

    const userWithFirm = { ...nextUser, firm: firm || nextUser?.firm || null };
    applyAuth(nextToken, userWithFirm);
    await loadEntitlements(nextToken, userWithFirm);
    return { token: nextToken, user: userWithFirm, firm };
  }, [applyAuth, loadEntitlements]);

  const planTier = normalizePlan(
    entitlementState.plan || user?.plan_tier || user?.firm?.plan_tier || "free"
  );
  const entitlementSet = useMemo(
    () => new Set(entitlementState.entitlements || []),
    [entitlementState.entitlements]
  );
  const platformAdmin = evaluatePlatformAdmin(user) || Boolean(entitlementState.platformAdmin);
  const administrator = platformAdmin || evaluateAdministrator(user);
  const executiveUser = administrator || evaluateExecutiveUser(user);
  const accessLevel = getUserAccessLevel(user);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    signup,
    logout,
    refreshMe,
    setUser: (nextUser) => applyAuth(token, nextUser),
    planTier,
    entitlements: entitlementState.entitlements || [],
    entitlementSet,
    limits: entitlementState.limits || {},
    usage: entitlementState.usage || {},
    entitlementBuild: entitlementState.build || "",
    isPlatformAdmin: platformAdmin,
    isAdministrator: administrator,
    isExecutive: executiveUser,
    accessLevel,
    canViewAllPages: canViewAdvancedNavigation(user),
    can: (entitlement) => administrator || entitlementSet.has(entitlement),
    canAccess: (requiredPlan) => {
      const levels = { free: 0, starter: 1, pro: 2, enterprise: 3 };
      return administrator || levels[planTier] >= levels[normalizePlan(requiredPlan)];
    },
    canAccessRoute: (pathname) => evaluateRouteAccess({
      pathname,
      planTier,
      entitlementSet,
      user,
    }),
    refreshEntitlements: () => loadEntitlements(token || getStoredToken(), user),
  }), [
    token,
    user,
    loading,
    login,
    signup,
    logout,
    refreshMe,
    applyAuth,
    planTier,
    entitlementState,
    entitlementSet,
    platformAdmin,
    administrator,
    executiveUser,
    accessLevel,
    loadEntitlements,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

