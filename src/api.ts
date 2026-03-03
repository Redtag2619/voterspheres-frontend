const API_BASE = "https://voterspheres-backend-2pap.onrender.com";

const limit = 10;

export async function fetchStates() {
  const res = await fetch(`${API_BASE}/dropdowns/states`);
  if (!res.ok) throw new Error("Failed to load states");
  return res.json();
}

export async function fetchOffices() {
  const res = await fetch(`${API_BASE}/dropdowns/offices`);
  if (!res.ok) throw new Error("Failed to load offices");
  return res.json();
}

export async function fetchParties() {
  const res = await fetch(`${API_BASE}/dropdowns/parties`);
  if (!res.ok) throw new Error("Failed to load parties");
  return res.json();
}

export async function fetchCandidates(params: {
  q?: string;
  state?: string;
  county?: string;
  office?: string;
  party?: string;
  page?: number;
}) {
  const query = new URLSearchParams({
    q: params.q || "",
    state: params.state || "",
    county: params.county || "",
    office: params.office || "",
    party: params.party || "",
    page: String(params.page || 1),
    limit: String(limit),
  });

  const res = await fetch(`${API_BASE}/candidates?${query}`);
  if (!res.ok) throw new Error("Failed to load candidates");

  return res.json();
}
