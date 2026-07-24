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
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE ||
    DEFAULT_API_ORIGIN
);

console.log(
  "[VoterSpheres] Political Intelligence Fabric API_BASE:",
  API_BASE
);

function cleanToken(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^"(.*)"$/, "$1");
}

function extractTokenFromJson(value) {
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object") {
      return "";
    }

    return cleanToken(
      parsed.token ||
        parsed.authToken ||
        parsed.accessToken ||
        parsed.access_token ||
        parsed.jwt ||
        parsed?.auth?.token ||
        parsed?.auth?.accessToken ||
        parsed?.session?.token ||
        parsed?.session?.accessToken ||
        parsed?.user?.token
    );
  } catch {
    return "";
  }
}

function getToken() {
  const directKeys = [
    "token",
    "authToken",
    "accessToken",
    "access_token",
    "jwt",
    "voterspheres_token",
    "vs_token",
  ];

  for (const key of directKeys) {
    const localValue = cleanToken(
      localStorage.getItem(key)
    );

    if (localValue) {
      return localValue;
    }

    const sessionValue = cleanToken(
      sessionStorage.getItem(key)
    );

    if (sessionValue) {
      return sessionValue;
    }
  }

  const objectKeys = [
    "auth",
    "user",
    "session",
    "authState",
    "auth-storage",
    "voterspheres-auth",
    "voterspheres_auth",
  ];

  for (const key of objectKeys) {
    const localToken = extractTokenFromJson(
      localStorage.getItem(key)
    );

    if (localToken) {
      return localToken;
    }

    const sessionToken = extractTokenFromJson(
      sessionStorage.getItem(key)
    );

    if (sessionToken) {
      return sessionToken;
    }
  }

  return "";
}

function buildUrl(path) {
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${String(path || "")}`;

  return `${API_BASE}${normalizedPath}`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unwrapPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  if (
    payload.data &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }

  if (
    payload.result &&
    typeof payload.result === "object"
  ) {
    return payload.result;
  }

  return payload;
}

function findFindings(payload = {}) {
  const candidates = [
    payload.findings,
    payload.signals,
    payload.items,
    payload.results,
    payload.alerts,
    payload?.scan?.findings,
    payload?.scan?.signals,
    payload?.overview?.findings,
    payload?.overview?.signals,
    payload?.intelligence?.findings,
    payload?.intelligence?.signals,
    payload?.data?.findings,
    payload?.data?.signals,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function normalizePoliticalFabricPayload(
  rawPayload
) {
  const payload = unwrapPayload(rawPayload);

  const scan =
    payload?.scan &&
    typeof payload.scan === "object"
      ? payload.scan
      : payload;

  const findings = findFindings(payload);

  const normalized = {
    ...payload,
    ...scan,

    findings,

    signals: findings,

    metrics:
      scan?.metrics ||
      payload?.metrics ||
      payload?.summary ||
      {},

    source_health:
      scan?.source_health ||
      payload?.source_health ||
      payload?.sourceHealth ||
      {},

    watchlist: asArray(
      payload?.watchlist ||
        scan?.watchlist
    ),

    recent_briefs: asArray(
      payload?.recent_briefs ||
        payload?.briefs ||
        scan?.recent_briefs ||
        scan?.briefs
    ),
  };

  console.log(
    "[Political Intelligence Fabric] Normalized payload:",
    {
      rawKeys:
        rawPayload &&
        typeof rawPayload === "object"
          ? Object.keys(rawPayload)
          : [],

      payloadKeys:
        payload &&
        typeof payload === "object"
          ? Object.keys(payload)
          : [],

      findingCount:
        normalized.findings.length,

      firstFinding:
        normalized.findings[0] || null,
    }
  );

  return normalized;
}

async function request(path, options = {}) {
  const token = getToken();
  const url = buildUrl(path);

  console.log(
    "[Political Intelligence Fabric Auth]",
    {
      tokenFound: Boolean(token),
      tokenLength: token?.length || 0,
      url,
    }
  );

  let response;

  try {
    response = await fetch(url, {
      ...options,

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",

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

  let payload;

  try {
    payload = contentType.includes(
      "application/json"
    )
      ? await response.json()
      : await response.text();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      console.error(
        "[Political Intelligence Fabric] Authentication failed:",
        {
          tokenFound: Boolean(token),
          tokenLength: token?.length || 0,
          payload,
        }
      );

      throw new Error(
        token
          ? "Your session is invalid or expired. Sign out and sign back in."
          : "No authentication token was found. Sign out and sign back in."
      );
    }

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

  console.log(
    "[Political Intelligence Fabric] Raw response:",
    {
      url,
      status: response.status,
      payload,
    }
  );

  return payload;
}

export async function fetchPoliticalFabricHealth(
  workspaceId = 1
) {
  return request(
    `/political-intelligence-fabric/health?workspace_id=${encodeURIComponent(
      workspaceId
    )}`
  );
}

export async function fetchPoliticalFabricOverview(
  workspaceId = 1
) {
  const payload = await request(
    `/political-intelligence-fabric/overview?workspace_id=${encodeURIComponent(
      workspaceId
    )}`
  );

  return normalizePoliticalFabricPayload(
    payload
  );
}

export async function runPoliticalFabricScan(
  payload = {}
) {
  const response = await request(
    "/political-intelligence-fabric/scan",
    {
      method: "POST",

      body: JSON.stringify({
        workspace_id: Number(
          payload.workspace_id || 1
        ),

        scope_type:
          payload.scope_type || "national",

        scope_value:
          payload.scope_value || null,

        state_code:
          payload.state_code || null,

        time_horizon:
          payload.time_horizon || "30d",

        limit: Number(
          payload.limit || 75
        ),

        ...payload,
      }),
    }
  );

  return normalizePoliticalFabricPayload(
    response
  );
}

export async function createPoliticalFabricBrief(
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

export async function fetchPoliticalFabricBriefs(
  workspaceId = 1
) {
  const payload = await request(
    `/political-intelligence-fabric/briefs?workspace_id=${encodeURIComponent(
      workspaceId
    )}`
  );

  const result = unwrapPayload(payload);

  return asArray(
    result?.briefs ||
      result?.recent_briefs ||
      result
  );
}

export async function fetchPoliticalFabricWatchlist(
  workspaceId = 1
) {
  const payload = await request(
    `/political-intelligence-fabric/watchlist?workspace_id=${encodeURIComponent(
      workspaceId
    )}`
  );

  const result = unwrapPayload(payload);

  return asArray(
    result?.watchlist ||
      result?.items ||
      result
  );
}

export async function savePoliticalFabricWatchlist(
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

export async function removePoliticalFabricWatchlist(
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

export async function runPoliticalFabricScenario(
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
