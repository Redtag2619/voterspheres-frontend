const API = "https://voterspheres-backend-2pap.onrender.com";

export const login = async (email, password) => {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
};

export const searchCandidates = async (query) => {
  const res = await fetch(`${API}/candidates/search?q=${query}`);
  return res.json();
};
