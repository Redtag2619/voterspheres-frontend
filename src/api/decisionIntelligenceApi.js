import { api } from "../services/api";

const fallbackDecisionIntelligence = {
  ok: true,
  source: "frontend-fallback",
  workspace_id: 1,
  summary: {
    openDecisions: 3,
    highPriority: 2,
    avgConfidence: 86,
    avgRisk: 31,
    liveSignals: 5,
  },
  decisions: [
    {
      id: "fallback-1",
      title: "Reallocate resources toward high-volatility battleground states",
      decision_type: "resource_allocation",
      priority: "high",
      status: "open",
      confidence_score: 91,
      risk_score: 34,
      impact_score: 88,
      urgency_score: 86,
      recommendation:
        "Shift field, vendor, and executive review capacity toward the highest volatility states while preserving national monitoring coverage.",
      rationale:
        "Forecast, coalition, influence, and operations indicators are clustering around competitive states with rising pressure.",
      source_modules: ["forecast", "coalitions", "influence", "operations"],
      options: [
        {
          id: "fallback-option-1",
          label: "Balanced resource shift",
          description: "Move 10-15% of available resources into priority states while preserving national coverage.",
          projected_impact: 86,
          projected_risk: 32,
          confidence: 88,
          cost_level: "medium",
          timeline: "7-14 days",
          rank_order: 1,
        },
        {
          id: "fallback-option-2",
          label: "Aggressive resource shift",
          description: "Move 20-30% of available resources into the highest volatility states.",
          projected_impact: 94,
          projected_risk: 55,
          confidence: 81,
          cost_level: "high",
          timeline: "3-7 days",
          rank_order: 2,
        },
      ],
      actions: [
        {
          id: "fallback-action-1",
          action_label: "Review battleground allocation model",
          owner: "Executive Operations",
          status: "pending",
          due_window: "24 hours",
        },
        {
          id: "fallback-action-2",
          action_label: "Validate vendor readiness in priority states",
          owner: "Vendor Operations",
          status: "pending",
          due_window: "72 hours",
        },
      ],
    },
    {
      id: "fallback-2",
      title: "Convert coalition instability into targeted field actions",
      decision_type: "coalition_activation",
      priority: "high",
      status: "open",
      confidence_score: 84,
      risk_score: 29,
      impact_score: 81,
      urgency_score: 78,
      recommendation:
        "Assign coalition owners to the most unstable voter blocs and convert each movement signal into Command Center tasks.",
      rationale:
        "Coalition movement suggests a time-sensitive opening for persuasion and turnout coordination.",
      source_modules: ["coalitions", "strategy", "command_center"],
      options: [
        {
          id: "fallback-option-3",
          label: "Activate coalition owners",
          description: "Assign responsible owners to top coalition opportunities and track weekly movement.",
          projected_impact: 82,
          projected_risk: 25,
          confidence: 84,
          cost_level: "medium",
          timeline: "5-10 days",
          rank_order: 1,
        },
      ],
      actions: [
        {
          id: "fallback-action-3",
          action_label: "Create coalition response tasks",
          owner: "Coalition Director",
          status: "pending",
          due_window: "48 hours",
        },
      ],
    },
    {
      id: "fallback-3",
      title: "Reduce decision risk before expanding digital spend",
      decision_type: "risk_control",
      priority: "medium",
      status: "planning",
      confidence_score: 79,
      risk_score: 30,
      impact_score: 73,
      urgency_score: 67,
      recommendation:
        "Hold major budget expansion until forecast confidence and message testing improve above executive threshold.",
      rationale:
        "Digital opportunity is present, but uncertainty remains in audience response and vendor capacity.",
      source_modules: ["forecast", "vendors", "influence"],
      options: [],
      actions: [],
    },
  ],
  signals: [
    {
      id: "fallback-signal-1",
      signal_type: "forecast_shift",
      title: "Forecast volatility rising",
      description: "Competitive movement detected across battleground modeling.",
      severity: "high",
      source_module: "forecast",
      state_code: "GA",
    },
    {
      id: "fallback-signal-2",
      signal_type: "coalition_movement",
      title: "Coalition instability detected",
      description: "Suburban and turnout-sensitive blocs require executive monitoring.",
      severity: "medium",
      source_module: "coalitions",
      state_code: "PA",
    },
    {
      id: "fallback-signal-3",
      signal_type: "vendor_capacity",
      title: "Vendor readiness gap",
      description: "Execution capacity needs verification before resource expansion.",
      severity: "medium",
      source_module: "vendors",
      state_code: "AZ",
    },
  ],
};

function normalizePayload(payload, workspaceId = 1) {
  const data = payload && typeof payload === "object" ? payload : {};
  const decisions = Array.isArray(data.decisions) ? data.decisions : [];
  const signals = Array.isArray(data.signals) ? data.signals : [];

  return {
    ...fallbackDecisionIntelligence,
    ...data,
    ok: data.ok !== false,
    workspace_id: data.workspace_id || workspaceId,
    summary: {
      ...fallbackDecisionIntelligence.summary,
      ...(data.summary || {}),
    },
    decisions: decisions.length ? decisions : fallbackDecisionIntelligence.decisions,
    signals: signals.length ? signals : fallbackDecisionIntelligence.signals,
  };
}

export async function fetchDecisionIntelligence(workspaceId = 1) {
  try {
    const { data } = await api.get("/decision-intelligence", {
      params: { workspace_id: workspaceId },
    });

    return normalizePayload(data, workspaceId);
  } catch (error) {
    console.error("[Decision Intelligence] Load failed:", error?.response?.data || error?.message || error);
    return normalizePayload({ ...fallbackDecisionIntelligence, source: "api-fallback" }, workspaceId);
  }
}

export async function seedDecisionIntelligence(workspaceId = 1) {
  try {
    const { data } = await api.post(
      "/decision-intelligence/seed",
      {},
      {
        params: { workspace_id: workspaceId },
      }
    );

    return data;
  } catch (error) {
    console.error("[Decision Intelligence] Seed failed:", error?.response?.data || error?.message || error);
    return { ok: false, error: "Seed endpoint unavailable." };
  }
}
