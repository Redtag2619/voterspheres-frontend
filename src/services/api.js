import axios from "axios";
import { getStoredToken } from "../lib/auth";
import { triggerUpgradePrompt } from "../lib/upgradePrompt";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend.onrender.com";

const api = axios.create({
  baseURL: API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data || {};

    if (status === 403 && (data?.requiredPlan || data?.error === "Upgrade required")) {
      triggerUpgradePrompt({
        requiredPlan: data.requiredPlan || "starter",
        currentPlan: data.currentPlan || "free",
        message: data.message || "Your current plan does not include this feature.",
        source: error?.config?.url || "",
      });
    }

    return Promise.reject(error);
  }
);

export default api;
