const BASE_URL = "https://voterspheres-backend.onrender.com";

export async function apiGet(path: string) {
  const res = await fetch(BASE_URL + path);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

// Login
export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  return res.json();
}

// Get voters (protected)
export async function getVoters(token) {
  const res = await fetch(`${API_URL}/api/voters`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
}
