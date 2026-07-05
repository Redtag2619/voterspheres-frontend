import { api } from "../services/api";

const fallbackExecutiveAiCommand = {
  ok: true,
  source: "frontend-fallback",
  workspace_id: 1,
  summary: {
    activeCommandBriefs: 1,
    activeExecutiveMissions: 3,
    queuedApprovalActions: 7,
    nationalReadinessPercentage: 79,
    aiConfidencePercentage: 87,
    executionRiskPercentage: 31,
  },
  brief: {
    id: "fallback-brief-1",
    title: "National Executive AI Command Brief",
    command_status: "active",
    executive_priority: "high",
    national_readiness_percentage: 79,
    win_probability_percentage: 55,
    ai_confidence_percentage: 87,
    execution_risk_percentage: 31,
    autonomous_readiness_percentage: 77,
    strategic_summary:
      "The Executive AI Command Platform is synthesizing decision intelligence, predictive simulation, national digital twin modeling, and autonomous operations into one command layer.",
    recommended_action:
      "Prioritize battleground execution readiness, approve high-confidence autonomous plans, and continue simulation review before major resource movement.",
    source_modules: [
      "Executive Decision Intelligence",
      "Predictive Campaign Simulation",
      "National Political Digital Twin",
      "Autonomous Campaign Operations",
      "Executive Forecast Engine",
      "Command Center",
    ],
  },
  missions: [
    {
      id: "fallback-mission-1",
      title: "Georgia Battleground Execution Mission",
      mission_type: "battleground_execution",
      geographic_scope: "Georgia",
      state_name: "Georgia",
      status: "pending_approval",
      priority: "high",
      impact_percentage: 86,
      confidence_percentage: 88,
      risk_percentage: 29,
      mission_summary: "Approve a coordinated field, coalition, and vendor execution package for Georgia.",
      approval_status: "executive_review",
      actions: [
        {
          id: "fallback-action-1",
          title: "Approve Command Center task conversion",
          description: "Convert the Georgia mission package into operational tasks.",
          owner: "Executive Operations",
          status: "queued",
          approval_required: true,
          due_window: "24 hours",
        },
      ],
    },
    {
      id: "fallback-mission-2",
      title: "Pennsylvania Coalition Stabilization Mission",
      mission_type: "coalition_stabilization",
      geographic_scope: "Pennsylvania",
      state_name: "Pennsylvania",
      status: "pending_approval",
      priority: "high",
      impact_percentage: 82,
      confidence_percentage: 84,
      risk_percentage: 34,
      mission_summary: "Deploy coalition monitoring and persuasion response tasks in Pennsylvania.",
      approval_status: "executive_review",
      actions: [],
    },
  ],
  timeline: [
    {
      id: "fallback-event-1",
      event_title: "Executive command brief generated",
      event_description:
        "AI synthesized decision intelligence, predictive simulation, digital twin, and autonomous operations data.",
      event_type: "command_brief",
      source_module: "Executive AI Command Platform",
      state_name: "National Coverage",
      impact_percentage: 12,
    },
  ],
};

function normalizePayload(payload, workspaceId = 1) {
  const data = payload && typeof payload === "object" ? payload : {};

  return {
    ...fallbackExecutiveAiCommand,
    ...data,
    workspace_id: data.workspace_id || workspaceId,
    summary: {
      ...fallbackExecutiveAiCommand.summary,
      ...(data.summary || {}),
    },
    brief: data.brief || fallbackExecutiveAiCommand.brief,
    missions:
      Array.isArray(data.missions) && data.missions.length
        ? data.missions
        : fallbackExecutiveAiCommand.missions,
    timeline:
      Array.isArray(data.timeline) && data.timeline.length
        ? data.timeline
        : fallbackExecutiveAiCommand.timeline,
  };
}

export async function fetchExecutiveAiCommand(workspaceId = 1) {
  try {
    const { data } = await api.get("/executive-ai-command", {
      params: { workspace_id: workspaceId },
    });

    return normalizePayload(data, workspaceId);
  } catch (error) {
    console.error("[Executive AI Command] Load failed:", error?.response?.data || error?.message || error);

    return normalizePayload(
      {
        ...fallbackExecutiveAiCommand,
        source: "api-fallback",
      },
      workspaceId
    );
  }
}

export async function seedExecutiveAiCommand(workspaceId = 1) {
  try {
    const { data } = await api.post(
      "/executive-ai-command/seed",
      {},
      {
        params: { workspace_id: workspaceId },
      }
    );

    return data;
  } catch (error) {
    console.error("[Executive AI Command] Seed failed:", error?.response?.data || error?.message || error);

    return {
      ok: false,
      error: "Seed endpoint unavailable.",
    };
  }
}

export async function generateExecutiveAiMission(payload = {}, workspaceId = 1) {
  try {
    const { data } = await api.post(
      "/executive-ai-command/generate",
      payload,
      {
        params: { workspace_id: workspaceId },
      }
    );

    return data;
  } catch (error) {
    console.error("[Executive AI Command] Generate failed:", error?.response?.data || error?.message || error);

    return {
      ok: false,
      error: "Generate endpoint unavailable.",
    };
  }
}
