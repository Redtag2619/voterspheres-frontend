const API_URL = import.meta.env.VITE_API_URL;
// or process.env.REACT_APP_API_URL

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
