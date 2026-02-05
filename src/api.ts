const API_BASE = "http://localhost:10000";

export async function fetchCandidates(params = "") {
  const res = await fetch(`${API_BASE}/api/candidates${params}`);
  return res.json();
}

export async function fetchConsultants(params = "") {
  const res = await fetch(`${API_BASE}/api/consultants${params}`);
  return res.json();
}

export async function fetchVendors(params = "") {
  const res = await fetch(`${API_BASE}/api/vendors${params}`);
  return res.json();
}

export async function fetchCandidateDropdown() {
  const res = await fetch(`${API_BASE}/api/dropdowns/candidates`);
  return res.json();
}

export async function fetchConsultantDropdown() {
  const res = await fetch(`${API_BASE}/api/dropdowns/consultants`);
  return res.json();
}
