import { getStoredToken } from "../lib/auth.js";

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://voterspheres-backend-2pap.onrender.com/api";

const CLEAN_API_BASE = String(RAW_API_BASE)
  .trim()
  .replace(/\/+$/, "");

const API_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      query.set(key, String(value));
    }
  });

  const output = query.toString();

  return output ? `?${output}` : "";
}

async function request(path, options = {}) {
  const token = getStoredToken();

  const normalizedPath = String(path).startsWith("/")
    ? String(path)
    : `/${String(path)}`;

  const url = `${API_BASE}${normalizedPath}`;

  const response = await fetch(url, {
    ...options,

    headers: {
      Accept: "application/json",

      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  const payload = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload?.error ||
        payload?.message ||
        `Polling request failed with HTTP ${response.status}.`
    );

    error.status = response.status;
    error.url = url;
    error.payload = payload;

    console.error("[ExecutivePolling] request failed", {
      url,
      status: response.status,
      payload,
      tokenFound: Boolean(token),
    });

    throw error;
  }

  return payload;
}

export function getExecutivePollingDashboard(params = {}) {
  return request(
    `/executive-polling-intelligence/dashboard${buildQuery(
      params
    )}`
  );
}

export function getExecutivePollingHealth() {
  return request(
    "/executive-polling-intelligence/health"
  );
}

export function listExecutivePollingRecords(params = {}) {
  return request(
    `/executive-polling-intelligence/records${buildQuery(
      params
    )}`
  );
}

export default {
  getExecutivePollingDashboard,
  getExecutivePollingHealth,
  listExecutivePollingRecords,
};

