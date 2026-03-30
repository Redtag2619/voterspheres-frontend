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

function isNotFound(error) {
  return error?.response?.status === 404;
}

async function unwrap(promise) {
  const response = await promise;
  return response.data;
}

async function tryGet(paths, config = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await unwrap(http.get(path, config));
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) break;
    }
  }

  throw lastError;
}

async function tryPost(paths, body = {}, config = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await unwrap(http.post(path, body, config));
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) break;
    }
  }

  throw lastError;
}

async function tryPatch(paths, body = {}, config = {}) {
  let lastError;

  for (const path of paths) {
    try {
      return await unwrap(http.patch(path, body, config));
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) break;
    }
  }

  throw lastError;
}

function normalizeListResult(data, preferredKeys = []) {
  if (Array.isArray(data)) return data;

  for (const key of preferredKeys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.rows)) return data.rows;

  return [];
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
  list: async (params = {}) => {
    const data = await tryGet(["/candidates"], { params });
    return Array.isArray(data) ? data : data;
  },
  states: async () => {
    const data = await tryGet(["/candidates/states"]);
    return normalizeListResult(data, ["states"]);
  },
  offices: async () => {
    const data = await tryGet(["/candidates/offices"]);
    return normalizeListResult(data, ["offices"]);
  },
  parties: async () => {
    const data = await tryGet(["/candidates/parties"]);
    return normalizeListResult(data, ["parties"]);
  },
  bySlug: (slug) => unwrap(http.get(`/candidates/${slug}`)),
};

export const intelligenceApi = {
  summary: () => tryGet(["/intelligence/summary"]),
  dashboard: () => tryGet(["/intelligence/dashboard"]),
  forecast: () => tryGet(["/intelligence/forecast"]),
  rankings: () => tryGet(["/intelligence/rankings"]),
  map: () => tryGet(["/intelligence/map"]),
  liveFundraising: () =>
    tryGet(["/intelligence/fundraising/live", "/fec/fundraising/live"]),
  fundraisingLeaderboard: () =>
    tryGet([
      "/intelligence/fundraising/leaderboard",
      "/fec/fundraising/leaderboard",
    ]),
};

export const platformApi = {
  aiChat: () => tryGet(["/platform/ai-chat"]),
  postAiPrompt: (payload) => tryPost(["/platform/ai-chat"], payload),
  warRoom: () => tryGet(["/platform/war-room"]),
  simulator: () => tryGet(["/platform/simulator"]),
  commandCenter: () => tryGet(["/platform/command-center"]),

  consultants: async (params = {}) => {
    const data = await tryGet(
      ["/platform/consultants", "/consultants", "/marketplace/consultants"],
      { params }
    );
    return Array.isArray(data) ? { results: data } : data;
  },

  consultantStates: async () => {
    const data = await tryGet([
      "/platform/consultants/states",
      "/consultants/states",
      "/marketplace/consultants/states",
    ]);
    return normalizeListResult(data, ["states"]);
  },
};

export const vendorsApi = {
  states: async () => {
    const data = await tryGet([
      "/vendors/states",
      "/platform/vendors/states",
      "/crm/vendors/states"
    ]);
    return normalizeListResult(data, ["states"]);
  },

  list: async (params = {}) => {
    const data = await tryGet(
      ["/vendors", "/platform/vendors", "/crm/vendors"],
      { params }
    );
    return Array.isArray(data) ? { results: data } : data;
  }
};

export const alertsApi = {
  list: () => tryGet(["/alerts"]),
  rebuild: () => tryPost(["/alerts/rebuild"], {}),
  resolve: (payload) => tryPost(["/alerts/resolve"], payload),
  dismiss: (payload) => tryPost(["/alerts/dismiss"], payload),
};

export const crmApi = {
  campaigns: async (params = {}) => {
    const data = await tryGet(["/crm/campaigns"], { params });
    return Array.isArray(data) ? data : data;
  },

  createCampaign: (payload) => tryPost(["/crm/campaigns"], payload),

  commandCenter: (campaignId) =>
    tryGet([`/campaigns/${campaignId}/command-center`]),

  activity: (campaignId) => tryGet([`/campaigns/${campaignId}/activity`]),

  createTask: (campaignId, payload) =>
    tryPost([`/campaigns/${campaignId}/tasks`], payload),
  updateTask: (campaignId, taskId, payload) =>
    tryPatch([`/campaigns/${campaignId}/tasks/${taskId}`], payload),

  createContact: (campaignId, payload) =>
    tryPost([`/campaigns/${campaignId}/contacts`], payload),

  createVendor: (campaignId, payload) =>
    tryPost([`/campaigns/${campaignId}/vendors`], payload),
  updateVendor: (campaignId, vendorId, payload) =>
    tryPatch([`/campaigns/${campaignId}/vendors/${vendorId}`], payload),

  createDocument: (campaignId, payload) =>
    tryPost([`/campaigns/${campaignId}/documents`], payload),

  createMailProgram: (campaignId, payload) =>
    tryPost([`/campaigns/${campaignId}/mail-programs`], payload),
  createMailDrop: (campaignId, payload) =>
    tryPost([`/campaigns/${campaignId}/mail-drops`], payload),
  createMailEvent: (campaignId, payload) =>
    tryPost([`/campaigns/${campaignId}/mail-events`], payload),
  updateMailEvent: (campaignId, eventId, payload) =>
    tryPatch([`/campaigns/${campaignId}/mail-events/${eventId}`], payload),

  firms: async (search = "") => {
    const params = search ? { search } : {};
    const data = await tryGet(["/crm/firms"], { params });
    return Array.isArray(data) ? { results: data } : data;
  },

  createFirm: (payload) => tryPost(["/crm/firms"], payload),

  firmWorkspace: (firmId) =>
    tryGet([
      `/firms/${firmId}/workspace`,
      `/crm/firms/${firmId}/workspace`,
    ]),
};

export const statesApi = {
  geoJson: async () => {
    try {
      return await tryGet(["/states/geojson"]);
    } catch (error) {
      const response = await fetch("/us-states.geojson");
      if (!response.ok) {
        throw error;
      }
      return response.json();
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

  intelligenceSummary: intelligenceApi.summary,
  intelligenceDashboard: intelligenceApi.dashboard,
  intelligenceForecast: intelligenceApi.forecast,
  intelligenceRankings: intelligenceApi.rankings,
  intelligenceMap: intelligenceApi.map,
  liveFundraising: intelligenceApi.liveFundraising,
  fundraisingLeaderboard: intelligenceApi.fundraisingLeaderboard,

  statesGeoJson: statesApi.geoJson,

  aiChat: platformApi.aiChat,
  postAiPrompt: platformApi.postAiPrompt,
  warRoom: platformApi.warRoom,
  simulator: platformApi.simulator,
  commandCenter: platformApi.commandCenter,
  consultants: platformApi.consultants,
  consultantStates: platformApi.consultantStates,

  vendorStates: vendorsApi.states,
  vendors: vendorsApi.list,

  alerts: alertsApi.list,
  rebuildAlerts: alertsApi.rebuild,
  resolveAlert: alertsApi.resolve,
  dismissAlert: alertsApi.dismiss,

  crmCampaigns: crmApi.campaigns,
  createCampaign: crmApi.createCampaign,

  firms: crmApi.firms,
  createFirm: crmApi.createFirm,
  firmWorkspace: crmApi.firmWorkspace,
};

export { http };
export default http;
