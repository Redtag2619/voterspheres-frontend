import { api } from "../services/api";

function unwrapResponse(response) {
  return response?.data || response;
}

export async function getExecutiveIntelligenceConfig() {
  const response = await api.get(
    "/executive-intelligence-orchestrator/config"
  );

  return unwrapResponse(response);
}

export async function planExecutiveIntelligence(payload = {}) {
  const response = await api.post(
    "/executive-intelligence-orchestrator/plan",
    payload
  );

  return unwrapResponse(response);
}

export async function askExecutiveIntelligence(payload = {}) {
  const question = String(
    payload.question ||
      payload.query ||
      payload.prompt ||
      ""
  ).trim();

  if (!question) {
    throw new Error(
      "An executive intelligence question is required."
    );
  }

  const response = await api.post(
    "/executive-intelligence-orchestrator/brief",
    {
      ...payload,
      question,
      prompt: payload.prompt || question,
      workspace_id:
        payload.workspace_id ||
        payload.workspaceId ||
        1,
    }
  );

  return unwrapResponse(response);
}

export default {
  getExecutiveIntelligenceConfig,
  planExecutiveIntelligence,
  askExecutiveIntelligence,
};
