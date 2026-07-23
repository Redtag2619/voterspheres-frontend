const DEFAULT_API_ORIGIN =
  "https://voterspheres-backend-2pap.onrender.com";

function normalizeApiBase(value = "") {
  const cleaned = String(value || "")
    .trim()
    .replace(/\/+$/, "");

  const base = cleaned || DEFAULT_API_ORIGIN;

  return base.endsWith("/api")
    ? base
    : `${base}/api`;
}

const API_BASE = normalizeApiBase(
  import.meta.env.VITE_API_BASE_URL
);

console.log(
  "[VoterSpheres] Political Intelligence Fabric API_BASE:",
  API_BASE
);

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function buildUrl(path) {
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${String(path || "")}`;

  return `${API_BASE}${normalizedPath}`;
}

async function request(path, options = {}) {
  const token = getToken();
  const url = buildUrl(path);

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    console.error(
      "[Political Intelligence Fabric] Network error:",
      {
        url,
        message: error?.message,
      }
    );

    throw new Error(
      "Unable to connect to the Political Intelligence Fabric service."
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object"
        ? payload.error ||
          payload.message ||
          `Request failed with status ${response.status}`
        : payload ||
          `Request failed with status ${response.status}`;

    console.error(
      "[Political Intelligence Fabric] Request failed:",
      {
        url,
        status: response.status,
        payload,
      }
    );

    throw new Error(message);
  }

  return payload;
}

export function fetchPoliticalFabricHealth(
  workspaceId = 1
) {
  return request(
    `/political-intelligence-fabric/health?workspace_id=${encodeURIComponent(
      workspaceId
    )}`
  );
}

export function fetchPoliticalFabricOverview(
  workspaceId = 1
) {
  return request(
    `/political-intelligence-fabric/overview?workspace_id=${encodeURIComponent(
      workspaceId
    )}`
  );
}

export function runPoliticalFabricScan(
  payload = {}
) {
  return request(
    "/political-intelligence-fabric/scan",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function createPoliticalFabricBrief(
  payload = {}
) {
  return request(
    "/political-intelligence-fabric/briefs",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function fetchPoliticalFabricBriefs(
  workspaceId = 1
) {
  return request(
    `/political-intelligence-fabric/briefs?workspace_id=${encodeURIComponent(
      workspaceId
    )}`
  );
}

export function fetchPoliticalFabricWatchlist(
  workspaceId = 1
) {
  return request(
    `/political-intelligence-fabric/watchlist?workspace_id=${encodeURIComponent(
      workspaceId
    )}`
  );
}

export function savePoliticalFabricWatchlist(
  payload = {}
) {
  return request(
    "/political-intelligence-fabric/watchlist",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function removePoliticalFabricWatchlist(
  id,
  workspaceId = 1
) {
  if (!id) {
    throw new Error(
      "A watchlist item ID is required."
    );
  }

  return request(
    `/political-intelligence-fabric/watchlist/${encodeURIComponent(
      id
    )}?workspace_id=${encodeURIComponent(
      workspaceId
    )}`,
    {
      method: "DELETE",
    }
  );
}

export function runPoliticalFabricScenario(
  payload = {}
) {
  return request(
    "/political-intelligence-fabric/scenarios",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
