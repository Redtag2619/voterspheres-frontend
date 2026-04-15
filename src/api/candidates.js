const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function fetchCandidates(params = {}) {
  const response = await fetch(
    `${API_BASE_URL}/api/candidates${buildQuery(params)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to load candidates.");
  }

  return data;
}

export async function fetchCandidateBySlug(slug) {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${slug}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to load candidate profile.");
  }

  return data;
}

export async function patchCandidateContact(id, payload) {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}/contact`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to update candidate contact info.");
  }

  return data;
}
