import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { enrichUserWithPermissions } from "../lib/permissions.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "vs_token";
const USER_KEY = "vs_user";

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

function getStoredUser() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return enrichUserWithPermissions(parsed);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function setStoredAuth(token, user) {
  if (typeof window === "undefined") return;

  const safeToken = token || "";
  const enrichedUser = user ? enrichUserWithPermissions(user) : null;

  if (safeToken) {
    localStorage.setItem(TOKEN_KEY, safeToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (enrichedUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function normalizeAuthResponse(data = {}) {
  const token = data?.token || "";
  const rawUser = data?.user || null;
  const rawFirm = data?.firm || null;

  const user = rawUser
    ? enrichUserWithPermissions({
        ...rawUser,
        firm: rawFirm || rawUser?.firm || null
      })
    : null;

  return { token, user, firm: rawFirm };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

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
  }, []);

  const bootstrapAuth = useCallback(async () => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    if (storedUser) {
      setUser(storedUser);
    }

    try {
      const response = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      });

      const me = response?.data || null;

      if (!me) {
        logout();
        return;
      }

      applyAuth(storedToken, me);
    } catch (error) {
      console.error("Auth bootstrap failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [applyAuth, logout]);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const login = useCallback(
    async (email, password) => {
      const response = await api.post("/auth/login", {
        email,
        password
      });

      const { token: nextToken, user: nextUser } = normalizeAuthResponse(response?.data || {});

      if (!nextToken || !nextUser) {
        throw new Error("Login response was missing token or user.");
      }

      applyAuth(nextToken, nextUser);
      return { token: nextToken, user: nextUser };
    },
    [applyAuth]
  );

  const signup = useCallback(
    async (form) => {
      const response = await api.post("/auth/signup", form);
      const { token: nextToken, user: nextUser, firm } = normalizeAuthResponse(response?.data || {});

      if (!nextToken || !nextUser) {
        throw new Error("Signup response was missing token or user.");
      }

      const userWithFirm = {
        ...nextUser,
        firm: firm || nextUser?.firm || null
      };

      applyAuth(nextToken, userWithFirm);
      return { token: nextToken, user: userWithFirm, firm };
    },
    [applyAuth]
  );

  const refreshMe = useCallback(async () => {
    const activeToken = token || getStoredToken();

    if (!activeToken) {
      logout();
      return null;
    }

    const response = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    const me = response?.data || null;

    if (!me) {
      logout();
      return null;
    }

    applyAuth(activeToken, me);
    return enrichUserWithPermissions(me);
  }, [applyAuth, logout, token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
      refreshMe,
      setUser: (nextUser) => applyAuth(token, nextUser)
    }),
    [token, user, loading, login, signup, logout, refreshMe, applyAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
