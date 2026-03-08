const BASE_URL = "https://voterspheres-backend.onrender.com";

export async function apiGet(path: string, token?: string) {
  const res = await fetch(BASE_URL + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) throw new Error("Request failed");

  return res.json();
}

export async function apiPost(path: string, data: any) {
  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}
