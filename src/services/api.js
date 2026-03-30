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

async function unwrap(promise) {
  const response = await promise;
  return response.data;
}

http.interceptors.request.use(
  (config) => {
    const token = getStoredToken?.();

    if (token) {
      config.headers = config.headers || {};
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
      triggerUpgradePrompt?.({
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
  bySlug: (slug) => unwrap(http.get(`/candidates/${slug}`)),
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
};

export const platformApi = {
  aiChat: () => unwrap(http.get("/platform/ai-chat")),
  postAiPrompt: (payload) => unwrap(http.post("/platform/ai-chat", payload)),
  warRoom: () => unwrap(http.get("/platform/war-room")),
  simulator: () => unwrap(http.get("/platform/simulator")),
  commandCenter: () => unwrap(http.get("/platform/command-center")),
};

export const alertsApi = {
  list: () => unwrap(http.get("/alerts")),
  rebuild: () => unwrap(http.post("/alerts/rebuild", {})),
  resolve: (payload) => unwrap(http.post("/alerts/resolve", payload)),
  dismiss: (payload) => unwrap(http.post("/alerts/dismiss", payload)),
};

export const crmApi = {
  campaigns: (params = {}) => unwrap(http.get("/crm/campaigns", { params })),
  createCampaign: (payload) => unwrap(http.post("/crm/campaigns", payload)),

  commandCenter: (campaignId) =>
    unwrap(http.get(`/campaigns/${campaignId}/command-center`)),
  activity: (campaignId) =>
    unwrap(http.get(`/campaigns/${campaignId}/activity`)),

  createTask: (campaignId, payload) =>
    unwrap(http.post(`/campaigns/${campaignId}/tasks`, payload)),
  updateTask: (campaignId, taskId, payload) =>
    unwrap(http.patch(`/campaigns/${campaignId}/tasks/${taskId}`, payload)),

  createContact: (campaignId, payload) =>
    unwrap(http.post(`/campaigns/${campaignId}/contacts`, payload)),

  createVendor: (campaignId, payload) =>
    unwrap(http.post(`/campaigns/${campaignId}/vendors`, payload)),
  updateVendor: (campaignId, vendorId, payload) =>
    unwrap(http.patch(`/campaigns/${campaignId}/vendors/${vendorId}`, payload)),

  createDocument: (campaignId, payload) =>
    unwrap(http.post(`/campaigns/${campaignId}/documents`, payload)),

  createMailProgram: (campaignId, payload) =>
    unwrap(http.post(`/campaigns/${campaignId}/mail-programs`, payload)),
  createMailDrop: (campaignId, payload) =>
    unwrap(http.post(`/campaigns/${campaignId}/mail-drops`, payload)),
  createMailEvent: (campaignId, payload) =>
    unwrap(http.post(`/campaigns/${campaignId}/mail-events`, payload)),
  updateMailEvent: (campaignId, eventId, payload) =>
    unwrap(http.patch(`/campaigns/${campaignId}/mail-events/${eventId}`, payload)),
};

export const statesApi = {
  geoJson: async () => {
    try {
      return await unwrap(http.get("/states/geojson"));
    } catch {
      const res = await fetch("/us-states.geojson");
      if (!res.ok) {
        throw new Error("Failed to load states GeoJSON");
      }
      return res.json();
    }
  },
};

export const api = {
  get: (...args) => http.get(...args),
  post: (...args) => http.post(...args),
  put: (...args) => http.put(...args),
  patch: (...args) => http.patch(...args),
  delete: (...args) => http.delete(...args),

  signup: authApi.signup,
  login: authApi.login,
  me: authApi.me,

  billingConfig: billingApi.config,
  billingDebug: billingApi.debugMe,
  createCheckoutSession: billingApi.createCheckoutSession,
  createPortalSession: billingApi.createPortalSession,

  candidates: candidatesApi.list,
  candidateStates: candidatesApi.states,
  candidateOffices: candidatesApi.offices,
  candidateParties: candidatesApi.parties,

  intelligenceMap: intelligenceApi.map,
  intelligenceForecast: intelligenceApi.forecast,
  intelligenceRankings: intelligenceApi.rankings,
  liveFundraising: intelligenceApi.liveFundraising,
  fundraisingLeaderboard: intelligenceApi.fundraisingLeaderboard,

  statesGeoJson: statesApi.geoJson,

  aiChat: platformApi.aiChat,
  postAiPrompt: platformApi.postAiPrompt,
  warRoom: platformApi.warRoom,
  simulator: platformApi.simulator,
  commandCenter: platformApi.commandCenter,

  alerts: alertsApi.list,
  rebuildAlerts: alertsApi.rebuild,

  crmCampaigns: crmApi.campaigns,
  createCampaign: crmApi.createCampaign,
};

export { http };
export default http;
