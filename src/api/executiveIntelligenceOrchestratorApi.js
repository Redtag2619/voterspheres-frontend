import { api } from "../services/api";

export async function getExecutiveIntelligenceConfig() {
  const response = await api.get("/executive-intelligence-orchestrator/config");
  return response?.data || response;
}

export async function planExecutiveIntelligence(payload = {}) {
  const response = await api.post(
    "/executive-intelligence-orchestrator/plan",
    payload
  );
  return response?.data || response;
}

export async function askExecutiveIntelligence(payload = {}) {
  const response = await api.post(
    "/executive-intelligence-orchestrator/brief",
    payload
  );
  return response?.data || response;
}

export default {
  getExecutiveIntelligenceConfig,
  planExecutiveIntelligence,
  askExecutiveIntelligence,
};
