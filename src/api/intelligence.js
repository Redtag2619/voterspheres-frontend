import { api } from "../services/api";

export async function fetchCandidateIntelligenceSummary(params = {}) {
  const response = await api.get("/intelligence/candidate-summary", { params });
  return response.data;
}

export async function fetchBattlegrounds() {
  const response = await api.get("/intelligence/battlegrounds");
  return response.data;
}
