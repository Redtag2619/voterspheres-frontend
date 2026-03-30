import axios from "axios";
import { getStoredToken, clearStoredAuth } from "../lib/auth";
import { triggerUpgradePrompt } from "../lib/upgradePrompt";

const RAW_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend.onrender.com";

const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

const http = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

http.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data || {};

    if (
      status === 403 &&
      (data?.requiredPlan || data?.error === "Upgrade required")
    ) {
      triggerUpgradePrompt({
        requiredPlan: data.requiredPlan || "starter",
        currentPlan: data.currentPlan || "free",
        message:
          data.message || "Your current plan does not include this feature.",
        source: error?.config?.url || "",
      });
    }

    if (status === 401) {
      clearStoredAuth?.();
    }

    return Promise.reject(error);
  }
);

async function unwrap(promise) {
  const response = await promise;
  return response.data;
}

export const authApi = {
  signup: (payload) => unwrap(http.post("/auth/signup", payload)),
  login: (payload) => unwrap(http.post("/auth/login", payload)),
  me: () => unwrap(http.get("/auth/me")),
};

export const billingApi = {
  config: () => unwrap(http.get("/billing/config")),
  debugMe: () => unwrap(http.get("/billing/debug/me")),
  createCheckoutSession: (payload) =>
    unwrap(http.post("/billing/checkout-session", payload)),
  createPortalSession: (payload = {}) =>
    unwrap(http.post("/billing/portal-session", payload)),
};

export const candidatesApi = {
  list: (params = {}) => unwrap(http.get("/candidates", { params })),
  states: () => unwrap(http.get("/candidates/states")),
  offices: () => unwrap(http.get("/candidates/offices")),
  parties: () => unwrap(http.get("/candidates/parties")),
  getBySlug: (slug) => unwrap(http.get(`/candidates/${slug}`)),
};

export const intelligenceApi = {
  summary: () => unwrap(http.get("/intelligence/summary")),
  dashboard: () => unwrap(http.get("/intelligence/dashboard")),
  forecast: () => unwrap(http.get("/intelligence/forecast")),
  rankings: () => unwrap(http.get("/intelligence/rankings")),
  map: () => unwrap(http.get("/intelligence/map")),
  liveFundraising: () => unwrap(http.get("/intelligence/fundraising/live")),
  fundraisingLeaderboard: () =>
    unwrap(http.get("/intelligence/fundraising/leaderboard")),
  runFundraisingIngestion: (payload = {}) =>
    unwrap(http.post("/intelligence/fundraising/ingest", payload)),
};

export const statesApi = {
  geoJson: () => unwrap(http.get("/states/geojson")),
};

export const vendorsApi = {
  list: (params = {}) => unwrap(http.get("/vendors", { params })),
};

export const mapApi = {
  regions: (params = {}) => unwrap(http.get("/map", { params })),
};

export const crmApi = {
  dashboard: () => unwrap(http.get("/crm-dashboard")),
  listCampaigns: (params = {}) => unwrap(http.get("/crm/campaigns", { params })),
  listContacts: (params = {}) => unwrap(http.get("/crm/contacts", { params })),
};

export const firmApi = {
  workspace: () => unwrap(http.get("/firms")),
};

export { http };
export const api = http;
export default http;
