const API_URL = import.meta.env.VITE_API_URL as string;

// Health check
export async function checkHealth() {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

// Login
export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  return res.json();
}

// Get voters (protected)
export async function getVoters(token: string) {
  const res = await fetch(`${API_URL}/api/voters`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
}
