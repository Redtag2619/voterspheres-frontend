/**
 * VoterSpheres Auth Storage + Debug Layer
 */

const TOKEN_KEY = "vs_token";
const USER_KEY = "vs_user";

/**
 * Toggle debug logging
 * Set to false in production later if desired
 */
const DEBUG = true;

function log(...args) {
  if (DEBUG && typeof window !== "undefined") {
    console.log("[Auth]", ...args);
  }
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (err) {
    log("⚠️ Failed to parse JSON:", err);
    return null;
  }
}

/**
 * GET TOKEN
 */
export function getStoredToken() {
  if (typeof window === "undefined") return "";

  const token = localStorage.getItem(TOKEN_KEY) || "";

  if (DEBUG) {
    log("🔑 getStoredToken:", token ? "FOUND" : "EMPTY");
  }

  return token;
}

/**
 * GET USER
 */
export function getStoredUser() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    log("👤 getStoredUser: EMPTY");
    return null;
  }

  const parsed = safeParse(raw);

  if (!parsed) {
    localStorage.removeItem(USER_KEY);
    return null;
  }

  log("👤 getStoredUser:", parsed);

  return parsed;
}

/**
 * SET AUTH
 */
export function setStoredAuth(token, user) {
  if (typeof window === "undefined") return;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    log("✅ Token stored");
  } else {
    localStorage.removeItem(TOKEN_KEY);
    log("🧹 Token cleared");
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    log("✅ User stored:", user);
  } else {
    localStorage.removeItem(USER_KEY);
    log("🧹 User cleared");
  }
}

/**
 * CLEAR AUTH
 */
export function clearStoredAuth() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  log("🧹 Cleared all auth storage");
}

/**
 * DEBUG: Print full auth state
 */
export function debugAuthState() {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  const user = safeParse(userRaw);

  console.group("🔍 Auth Debug State");
  console.log("Token:", token);
  console.log("User (raw):", userRaw);
  console.log("User (parsed):", user);
  console.groupEnd();

  return { token, user };
}

/**
 * DEBUG: Force reset
 */
export function resetAuthState() {
  clearStoredAuth();

  if (typeof window !== "undefined") {
    location.href = "/login";
  }
}
