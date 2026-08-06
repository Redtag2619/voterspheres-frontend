const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://voterspheres-backend-2pap.onrender.com/api";

function storedToken() {
  const keys = [
    "token",
    "authToken",
    "access_token",
    "voterspheres_token",
  ];

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    return auth.token || auth.accessToken || "";
  } catch {
    return "";
  }
}

async function apiRequest(path, options = {}) {
  const token = storedToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload.error ||
      payload.message ||
      `Polling request failed with HTTP ${response.status}.`
    );

    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function queryString(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      search.set(key, String(value));
    }
  });

  const text = search.toString();
  return text ? `?${text}` : "";
}

export function getExecutivePollingDashboard(params = {}) {
  return apiRequest(
    `/executive-polling-intelligence/dashboard${queryString(params)}`
  );
}

export function getExecutivePollingHealth() {
  return apiRequest(
    "/executive-polling-intelligence/health"
  );
}

export function listExecutivePollingRecords(params = {}) {
  return apiRequest(
    `/executive-polling-intelligence/records${queryString(params)}`
  );
}

export default {
  getExecutivePollingDashboard,
  getExecutivePollingHealth,
  listExecutivePollingRecords,
};

