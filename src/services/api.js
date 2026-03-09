const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

export const api = {
  dashboard: () => request("/dashboard"),
  commandCenter: () => request("/command-center"),
  warRoom: () => request("/war-room"),
  forecast: () => request("/forecast"),
  electionMap: () => request("/map"),
  candidates: () => request("/candidates"),
  donors: () => request("/donors"),
  fundraising: () => request("/fundraising"),
  rankings: () => request("/rankings"),
  marketplace: () => request("/marketplace"),
  simulator: () => request("/simulator"),
  aiChat: () => request("/ai-chat"),

  postAiPrompt: (body) =>
    request("/ai-chat", {
      method: "POST",
      body: JSON.stringify(body)
    })
};
