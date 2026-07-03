import { api } from "../services/api";

const fallbackNationalDigitalTwin = {
  ok: true,
  source: "frontend-fallback",
  workspace_id: 1,
  summary: {
    nationalReadinessPercentage: 78,
    averageWinProbabilityPercentage: 54,
    nationalRiskPercentage: 36,
    liveSignalCount: 3,
    highAlertStateCount: 2,
    activeRecommendationCount: 2,
  },
  states: [
    {
      id: "fallback-ga",
      state_code: "GA",
      state_name: "Georgia",
      executive_readiness_percentage: 82,
      win_probability_percentage: 56,
      coalition_strength_percentage: 73,
      influence_momentum_percentage: 69,
      operations_capacity_percentage: 78,
      vendor_readiness_percentage: 76,
      fundraising_momentum_percentage: 71,
      forecast_confidence_percentage: 84,
      risk_percentage: 31,
      alert_level: "high",
      recommendation: "Increase executive field and coalition monitoring in priority counties.",
    },
    {
      id: "fallback-pa",
      state_code: "PA",
      state_name: "Pennsylvania",
      executive_readiness_percentage: 79,
      win_probability_percentage: 54,
      coalition_strength_percentage: 70,
      influence_momentum_percentage: 65,
      operations_capacity_percentage: 73,
      vendor_readiness_percentage: 72,
      fundraising_momentum_percentage: 67,
      forecast_confidence_percentage: 81,
      risk_percentage: 36,
      alert_level: "high",
      recommendation: "Prioritize suburban turnout and coalition stability monitoring.",
    },
    {
      id: "fallback-az",
      state_code: "AZ",
      state_name: "Arizona",
      executive_readiness_percentage: 74,
      win_probability_percentage: 51,
      coalition_strength_percentage: 66,
      influence_momentum_percentage: 61,
      operations_capacity_percentage: 69,
      vendor_readiness_percentage: 63,
      fundraising_momentum_percentage: 58,
      forecast_confidence_percentage: 77,
      risk_percentage: 42,
      alert_level: "monitoring",
      recommendation: "Validate vendor readiness before expanding execution commitments.",
    },
  ],
  signals: [
    {
      id: "fallback-signal-1",
      title: "Forecast and simulation divergence detected",
      description: "Predictive simulation is moving faster than baseline forecast in one battleground cluster.",
      source_module: "Predictive Campaign Simulation",
      severity: "high",
      state_name: "Georgia",
    },
    {
      id: "fallback-signal-2",
      title: "Coalition movement requires executive review",
      description: "Suburban coalition volatility is increasing in a priority state.",
      source_module: "National Coalition Intelligence",
      severity: "medium",
      state_name: "Pennsylvania",
    },
  ],
  timeline: [
    {
      id: "fallback-timeline-1",
      event_title: "Digital twin initialized",
      event_description: "Cross-module national model synthesized from forecast, operations, influence, coalition, and simulation layers.",
      event_type: "model_update",
      state_name: "National Coverage",
      impact_percentage: 12,
    },
  ],
  recommendations: [
    {
      id: "fallback-rec-1",
      title: "Prioritize battleground executive monitoring",
      recommendation: "Increase executive review cadence across Georgia, Pennsylvania, Arizona, Michigan, Nevada, and Wisconsin.",
      priority: "high",
      confidence_percentage: 87,
      impact_percentage: 84,
      risk_percentage: 32,
      source_modules: ["Executive Forecast Engine", "Predictive Campaign Simulation", "Executive Operations Center"],
      status: "open",
    },
  ],
};

function normalizePayload(payload, workspaceId = 1) {
  const data = payload && typeof payload === "object" ? payload : {};

  return {
    ...fallbackNationalDigitalTwin,
    ...data,
    workspace_id: data.workspace_id || workspaceId,
    summary: {
      ...fallbackNationalDigitalTwin.summary,
      ...(data.summary || {}),
    },
    states: Array.isArray(data.states) && data.states.length ? data.states : fallbackNationalDigitalTwin.states,
    signals: Array.isArray(data.signals) && data.signals.length ? data.signals : fallbackNationalDigitalTwin.signals,
    timeline: Array.isArray(data.timeline) && data.timeline.length ? data.timeline : fallbackNationalDigitalTwin.timeline,
    recommendations:
      Array.isArray(data.recommendations) && data.recommendations.length
        ? data.recommendations
        : fallbackNationalDigitalTwin.recommendations,
  };
}

export async function fetchNationalDigitalTwin(workspaceId = 1) {
  try {
    const { data } = await api.get("/national-digital-twin", {
      params: { workspace_id: workspaceId },
    });

    return normalizePayload(data, workspaceId);
  } catch (error) {
    console.error("[National Digital Twin] Load failed:", error?.response?.data || error?.message || error);

    return normalizePayload(
      {
        ...fallbackNationalDigitalTwin,
        source: "api-fallback",
      },
      workspaceId
    );
  }
}

export async function seedNationalDigitalTwin(workspaceId = 1) {
  try {
    const { data } = await api.post(
      "/national-digital-twin/seed",
      {},
      {
        params: { workspace_id: workspaceId },
      }
    );

    return data;
  } catch (error) {
    console.error("[National Digital Twin] Seed failed:", error?.response?.data || error?.message || error);

    return {
      ok: false,
      error: "Seed endpoint unavailable.",
    };
  }
}

export async function getNationalDigitalTwinHealth() {
  try {
    const { data } = await api.get("/national-digital-twin/health");
    return data;
  } catch (error) {
    return {
      ok: false,
      service: "National Political Digital Twin",
      error: "Health endpoint unavailable.",
    };
  }
}
