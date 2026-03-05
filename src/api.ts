const API_BASE = import.meta.env.VITE_API_URL;

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API error");
  }
  return res.json();
}

export async function fetchStates() {
  const res = await fetch(`${API_BASE}/candidates/states`);
  return handleResponse(res);
}

export async function fetchOffices() {
  const res = await fetch(`${API_BASE}/candidates/offices`);
  return handleResponse(res);
}

export async function fetchParties() {
  const res = await fetch(`${API_BASE}/candidates/parties`);
  return handleResponse(res);
}

export async function fetchCandidates(params: any) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, String(value));
  });

  const res = await fetch(
    `${API_BASE}/candidates?${query.toString()}`
  );

  return handleResponse(res);
}
