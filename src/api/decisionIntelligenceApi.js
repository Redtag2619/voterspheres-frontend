import { api } from "../services/api";

export async function fetchDecisionIntelligence(workspaceId = 1) {
  const response = await api.get("/decision-intelligence", {
    params: { workspace_id: workspaceId },
  });

  return response.data;
}

export async function seedDecisionIntelligence(workspaceId = 1) {
  const response = await api.post("/decision-intelligence/seed", null, {
    params: { workspace_id: workspaceId },
  });

  return response.data;
}