import { getStoredToken } from "../utils/authStorage";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:10000/api";

export async function fetchDecisionIntelligence(workspaceId = 1) {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE}/decision-intelligence?workspace_id=${workspaceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to load executive decision intelligence.");
  }

  return response.json();
}

export async function seedDecisionIntelligence(workspaceId = 1) {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE}/decision-intelligence/seed?workspace_id=${workspaceId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to seed executive decision intelligence.");
  }

  return response.json();
}
