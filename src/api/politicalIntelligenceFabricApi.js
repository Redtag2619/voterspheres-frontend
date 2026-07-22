const API_BASE =

  import.meta.env.VITE_API_BASE_URL ||

  "https://voterspheres-backend-2pap.onrender.com/api";

 

function getToken() {

  return (

    localStorage.getItem("token") ||

    localStorage.getItem("authToken") ||

    sessionStorage.getItem("token") ||

    ""

  );

}

 

async function request(path, options = {}) {

  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {

    ...options,

    headers: {

      "Content-Type": "application/json",

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      ...(options.headers || {})

    }

  });

 

  const contentType = response.headers.get("content-type") || "";

  const payload = contentType.includes("application/json")

    ? await response.json()

    : await response.text();

 

  if (!response.ok) {

    const message =

      typeof payload === "object"

        ? payload.error || payload.message

        : payload;

    throw new Error(message || `Request failed with status ${response.status}`);

  }

 

  return payload;

}

 

export function fetchPoliticalFabricOverview(workspaceId = 1) {

  return request(

    `/political-intelligence-fabric/overview?workspace_id=${workspaceId}`

  );

}

 

export function runPoliticalFabricScan(payload) {

  return request("/political-intelligence-fabric/scan", {

    method: "POST",

    body: JSON.stringify(payload)

  });

}

 

export function createPoliticalFabricBrief(payload) {

  return request("/political-intelligence-fabric/briefs", {

    method: "POST",

    body: JSON.stringify(payload)

  });

}

 

export function fetchPoliticalFabricBriefs(workspaceId = 1) {

  return request(

    `/political-intelligence-fabric/briefs?workspace_id=${workspaceId}`

  );

}

 

export function fetchPoliticalFabricWatchlist(workspaceId = 1) {

  return request(

    `/political-intelligence-fabric/watchlist?workspace_id=${workspaceId}`

  );

}

 

export function savePoliticalFabricWatchlist(payload) {

  return request("/political-intelligence-fabric/watchlist", {

    method: "POST",

    body: JSON.stringify(payload)

  });

}

 

export function removePoliticalFabricWatchlist(id, workspaceId = 1) {

  return request(

    `/political-intelligence-fabric/watchlist/${id}?workspace_id=${workspaceId}`,

    { method: "DELETE" }

  );

}

 

export function runPoliticalFabricScenario(payload) {

  return request("/political-intelligence-fabric/scenarios", {

    method: "POST",

    body: JSON.stringify(payload)

  });

}
