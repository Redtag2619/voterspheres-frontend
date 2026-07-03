import { api } from "../services/api";

const fallbackAutonomousCampaignOperations = {
  ok: true,
  source: "frontend-fallback",
  workspace_id: 1,
  summary: {
    activeOperationPlans: 3,
    queuedAutonomousTasks: 8,
    highPriorityAlerts: 2,
    averageAutomationReadinessPercentage: 76,
    averageOperationalImpactPercentage: 82,
    averageExecutionRiskPercentage: 31,
  },
  plans: [
    {
      id: "fallback-plan-1",
      title: "Battleground Field Acceleration Plan",
      plan_type: "field_acceleration",
      geographic_scope: "Georgia",
      state_code: "GA",
      state_name: "Georgia",
      status: "pending_approval",
      priority: "high",
      confidence_percentage: 88,
      impact_percentage: 86,
      risk_percentage: 29,
      automation_readiness_percentage: 82,
      executive_summary:
        "Autonomous operations detected a high-value field acceleration opportunity in Georgia.",
      recommendation:
        "Approve queued field, vendor, coalition, and Command Center actions for priority county execution.",
      source_modules: [
        "National Political Digital Twin",
        "Predictive Campaign Simulation",
        "Executive Decision Intelligence",
        "Executive Operations Center",
      ],
      tasks: [
        {
          id: "fallback-task-1",
          title: "Create priority county field deployment queue",
          description: "Generate county-level field deployment tasks for executive review.",
          owner: "Executive Operations",
          status: "queued",
          priority: "high",
          due_window: "24 hours",
          automation_level: "executive_approval_required",
          command_center_ready: true,
        },
        {
          id: "fallback-task-2",
          title: "Validate vendor coverage for priority counties",
          description: "Confirm vendor capacity before expanding execution.",
          owner: "Vendor Operations",
          status: "queued",
          priority: "high",
          due_window: "48 hours",
          automation_level: "executive_approval_required",
          command_center_ready: true,
        },
      ],
    },
    {
      id: "fallback-plan-2",
      title: "Coalition Stability Response Plan",
      plan_type: "coalition_response",
      geographic_scope: "Pennsylvania",
      state_code: "PA",
      state_name: "Pennsylvania",
      status: "pending_approval",
      priority: "high",
      confidence_percentage: 84,
      impact_percentage: 81,
      risk_percentage: 34,
      automation_readiness_percentage: 78,
      executive_summary:
        "Coalition volatility requires coordinated response across messaging, field, and monitoring.",
      recommendation:
        "Create a coalition response queue and assign executive owners to persuasion-sensitive voter blocs.",
      source_modules: [
        "National Coalition Intelligence",
        "Executive Decision Intelligence",
        "National Political Digital Twin",
      ],
      tasks: [],
    },
  ],
  alerts: [
    {
      id: "fallback-alert-1",
      title: "Autonomous battleground acceleration trigger",
      description: "Digital twin and simulation layers indicate a field acceleration opportunity.",
      severity: "high",
      trigger_source: "National Political Digital Twin",
      state_name: "Georgia",
      recommended_response: "Approve field acceleration plan after vendor readiness validation.",
    },
    {
      id: "fallback-alert-2",
      title: "Vendor readiness constraint trigger",
      description: "Vendor capacity is below threshold for autonomous execution conversion.",
      severity: "medium",
      trigger_source: "Vendor Intelligence Network",
      state_name: "Arizona",
      recommended_response: "Review vendor recovery plan before automated task conversion.",
    },
  ],
  playbooks: [
    {
      id: "fallback-playbook-1",
      title: "Battleground Acceleration Playbook",
      playbook_type: "field_acceleration",
      description:
        "Converts forecast and simulation opportunities into field, vendor, and Command Center execution tasks.",
      activation_condition:
        "Win probability movement above three percentage points with execution readiness above seventy-five percent.",
      execution_steps: [
        "Confirm forecast confidence",
        "Validate vendor readiness",
        "Create Command Center task queue",
        "Assign executive owner",
      ],
      risk_controls: [
        "Require executive approval before activation",
        "Validate state operations capacity",
        "Monitor coalition backlash risk",
      ],
      status: "active",
    },
  ],
};

function normalizePayload(payload, workspaceId = 1) {
  const data = payload && typeof payload === "object" ? payload : {};

  return {
    ...fallbackAutonomousCampaignOperations,
    ...data,
    workspace_id: data.workspace_id || workspaceId,
    summary: {
      ...fallbackAutonomousCampaignOperations.summary,
      ...(data.summary || {}),
    },
    plans: Array.isArray(data.plans) && data.plans.length ? data.plans : fallbackAutonomousCampaignOperations.plans,
    alerts: Array.isArray(data.alerts) && data.alerts.length ? data.alerts : fallbackAutonomousCampaignOperations.alerts,
    playbooks:
      Array.isArray(data.playbooks) && data.playbooks.length
        ? data.playbooks
        : fallbackAutonomousCampaignOperations.playbooks,
  };
}

export async function fetchAutonomousCampaignOperations(workspaceId = 1) {
  try {
    const { data } = await api.get("/autonomous-campaign-operations", {
      params: { workspace_id: workspaceId },
    });

    return normalizePayload(data, workspaceId);
  } catch (error) {
    console.error("[Autonomous Campaign Operations] Load failed:", error?.response?.data || error?.message || error);

    return normalizePayload(
      {
        ...fallbackAutonomousCampaignOperations,
        source: "api-fallback",
      },
      workspaceId
    );
  }
}

export async function seedAutonomousCampaignOperations(workspaceId = 1) {
  try {
    const { data } = await api.post(
      "/autonomous-campaign-operations/seed",
      {},
      {
        params: { workspace_id: workspaceId },
      }
    );

    return data;
  } catch (error) {
    console.error("[Autonomous Campaign Operations] Seed failed:", error?.response?.data || error?.message || error);

    return {
      ok: false,
      error: "Seed endpoint unavailable.",
    };
  }
}

export async function generateAutonomousOperationPlan(payload = {}, workspaceId = 1) {
  try {
    const { data } = await api.post(
      "/autonomous-campaign-operations/generate",
      payload,
      {
        params: { workspace_id: workspaceId },
      }
    );

    return data;
  } catch (error) {
    console.error("[Autonomous Campaign Operations] Generate failed:", error?.response?.data || error?.message || error);

    return {
      ok: false,
      error: "Generate endpoint unavailable.",
    };
  }
}

export async function getAutonomousCampaignOperationsHealth() {
  try {
    const { data } = await api.get("/autonomous-campaign-operations/health");
    return data;
  } catch (error) {
    return {
      ok: false,
      service: "Autonomous Campaign Operations",
      error: "Health endpoint unavailable.",
    };
  }
}
