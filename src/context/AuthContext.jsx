import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { enrichUserWithPermissions } from "../lib/permissions.js";

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
    const parsed = JSON.parse(raw);
    return enrichUserWithPermissions(parsed);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setStoredAuth(token, user) {
  if (typeof window === "undefined") return;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(enrichUserWithPermissions(user)));
  } else {
    localStorage.removeItem(USER_KEY);
  }
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
        firm: data.user?.firm || firm || null
      })
    : null;

  return { token, user, firm };
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

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      if (storedUser && isMounted) {
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

        if (isMounted) {
          applyAuth(storedToken, me);
        }
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [applyAuth, logout]);

  const login = useCallback(
    async (email, password) => {
      const response = await api.post("/auth/login", {
        email,
        password
      });

      const { token: nextToken, user: nextUser } = normalizeAuthResponse(response?.data || {});

      if (!nextToken || !nextUser) {
        throw new Error("Login response missing token or user.");
      }

      applyAuth(nextToken, nextUser);
      return { token: nextToken, user: nextUser };
    },
    [applyAuth]
  );

  const signup = useCallback(
    async (payload) => {
      const response = await api.post("/auth/signup", payload);

      const { token: nextToken, user: nextUser, firm } = normalizeAuthResponse(response?.data || {});

      if (!nextToken || !nextUser) {
        throw new Error("Signup response missing token or user.");
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
