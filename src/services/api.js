const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.error
        ? data.error
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  health: () => request("/health"),

  candidates: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, value);
      }
    });

    return request(`/api/candidates${search.toString() ? `?${search}` : ""}`);
  },

  candidateStates: () => request("/api/candidates/dropdowns/states"),
  candidateOffices: () => request("/api/candidates/dropdowns/offices"),
  candidateParties: () => request("/api/candidates/dropdowns/parties"),
  candidateCounties: () => request("/api/candidates/dropdowns/counties"),

  consultants: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, value);
      }
    });

    return request(`/api/consultants${search.toString() ? `?${search}` : ""}`);
  },

  consultantStates: () => request("/api/consultants/dropdowns/states"),

  vendors: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, value);
      }
    });

    return request(`/api/vendors${search.toString() ? `?${search}` : ""}`);
  },

  vendorStates: () => request("/api/vendors/dropdowns/states"),

  intelligenceSummary: () => request("/api/intelligence/summary"),
  intelligenceDashboard: () => request("/api/intelligence/dashboard"),
  intelligenceForecast: () => request("/api/intelligence/forecast"),
  intelligenceRankings: () => request("/api/intelligence/rankings"),
  intelligenceMap: () => request("/api/intelligence/map"),

  liveFundraising: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, value);
      }
    });

    return request(
      `/api/intelligence/fundraising/live${
        search.toString() ? `?${search}` : ""
      }`
    );
  },

  fundraisingLeaderboard: () =>
    request("/api/intelligence/fundraising/leaderboard"),

  runFundraisingIngestion: (payload = {}) =>
    request("/api/intelligence/fundraising/ingest", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export default api;
