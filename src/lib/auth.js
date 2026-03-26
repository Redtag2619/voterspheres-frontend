const TOKEN_KEY = "voterspheres_token"; 
const USER_KEY = "voterspheres_user";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getStoredToken() {
  if (!isBrowser()) return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getStoredUser() {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setStoredAuth(token, user) {
  if (!isBrowser()) return;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearStoredAuth() {
  if (!isBrowser()) return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthHeader() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
