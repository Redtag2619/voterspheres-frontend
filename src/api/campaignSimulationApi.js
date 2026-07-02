import { api } from "../services/api";

/*
=========================================================
VoterSpheres
Build 2E - Predictive Campaign Simulation API
=========================================================
*/ 

const fallbackCampaignSimulation = {
  ok: true,
  source: "frontend-fallback",
  workspace_id: 1,

  summary: {
    activeSimulations: 3,
    averageWinProbability: 56,
    averageTurnoutLift: 5,
    averageFundingImpact: 7,
    averageCoalitionMovement: 6,
    averageExecutionReadiness: 78,
  },

  simulations: [
    {
      id: "simulation-1",
      title: "Battleground Resource Expansion Simulation",
      simulation_type: "resource_expansion",

      state_code: "Georgia",

      status: "active",

      scenario_label:
        "Balanced Field And Vendor Expansion",

      baseline_win_probability: 49,

      simulated_win_probability: 56,

      turnout_lift_percentage: 5,

      funding_impact_percentage: 8,

      coalition_movement_percentage: 6,

      vendor_execution_readiness: 78,

      risk_percentage: 32,

      confidence_percentage: 86,

      recommendation:
        "Increase field capacity and vendor execution across priority counties while maintaining coalition monitoring.",

      assumptions: {
        field_capacity: "Moderate Increase",
        digital_spend: "Targeted Expansion",
      },

      outcomes: [
        {
          id: "outcome-1",

          outcome_label: "Expected Case",

          win_probability: 56,

          turnout_change_percentage: 5,

          funding_change_percentage: 8,

          coalition_change_percentage: 6,

          risk_percentage: 32,

          narrative:
            "Balanced expansion produces measurable improvement with acceptable operational risk.",
        },

        {
          id: "outcome-2",

          outcome_label: "Optimistic Case",

          win_probability: 61,

          turnout_change_percentage: 8,

          funding_change_percentage: 10,

          coalition_change_percentage: 9,

          risk_percentage: 38,

          narrative:
            "Coalition momentum exceeds expectations producing stronger probability gains.",
        },
      ],

      actions: [
        {
          id: "action-1",

          action_label:
            "Convert simulation into Executive Operations tasks",

          owner:
            "Executive Operations",

          status:
            "pending",

          due_window:
            "48 Hours",
        },

        {
          id: "action-2",

          action_label:
            "Verify Vendor Execution Capacity",

          owner:
            "Vendor Operations",

          status:
            "pending",

          due_window:
            "72 Hours",
        },
      ],
    },

    {
      id: "simulation-2",

      title:
        "Turnout Surge Simulation",

      simulation_type:
        "turnout_model",

      state_code:
        "Pennsylvania",

      status:
        "active",

      scenario_label:
        "Suburban And Youth Turnout Increase",

      baseline_win_probability: 51,

      simulated_win_probability: 58,

      turnout_lift_percentage: 7,

      funding_impact_percentage: 4,

      coalition_movement_percentage: 8,

      vendor_execution_readiness: 72,

      risk_percentage: 36,

      confidence_percentage: 82,

      recommendation:
        "Increase turnout operations within suburban persuasion corridors.",

      assumptions: {},

      outcomes: [],

      actions: [],
    },

    {
      id: "simulation-3",

      title:
        "Funding Compression Simulation",

      simulation_type:
        "funding_model",

      state_code:
        "Arizona",

      status:
        "monitoring",

      scenario_label:
        "Reduced Fundraising Growth",

      baseline_win_probability: 48,

      simulated_win_probability: 45,

      turnout_lift_percentage: -2,

      funding_impact_percentage: -6,

      coalition_movement_percentage: -3,

      vendor_execution_readiness: 61,

      risk_percentage: 54,

      confidence_percentage: 79,

      recommendation:
        "Stabilize fundraising pipeline before expanding campaign execution.",

      assumptions: {},

      outcomes: [],

      actions: [],
    },
  ],

  signals: [
    {
      id: "signal-1",

      title:
        "Turnout Sensitivity Increasing",

      description:
        "Simulation indicates turnout is the strongest driver of projected election movement.",

      severity:
        "high",

      source_module:
        "Predictive Campaign Simulation Engine",

      state_code:
        "Pennsylvania",
    },

    {
      id: "signal-2",

      title:
        "Vendor Readiness Constraint",

      description:
        "Vendor execution readiness remains below target in one scenario.",

      severity:
        "medium",

      source_module:
        "Vendor Intelligence Network",

      state_code:
        "Arizona",
    },

    {
      id: "signal-3",

      title:
        "Funding Compression Scenario",

      description:
        "Reduced fundraising momentum is decreasing projected win probability.",

      severity:
        "medium",

      source_module:
        "Fundraising Intelligence Layer",

      state_code:
        "Arizona",
    },
  ],
};

function normalizePayload(payload, workspaceId = 1) {
  const data =
    payload && typeof payload === "object"
      ? payload
      : {};

  return {
    ...fallbackCampaignSimulation,

    ...data,

    workspace_id:
      data.workspace_id || workspaceId,

    summary: {
      ...fallbackCampaignSimulation.summary,

      ...(data.summary || {}),
    },

    simulations:
      Array.isArray(data.simulations) &&
      data.simulations.length
        ? data.simulations
        : fallbackCampaignSimulation.simulations,

    signals:
      Array.isArray(data.signals) &&
      data.signals.length
        ? data.signals
        : fallbackCampaignSimulation.signals,
  };
}

/* =====================================================
   GET ALL SIMULATIONS
===================================================== */

export async function fetchCampaignSimulations(
  workspaceId = 1
) {
  try {
    const { data } = await api.get(
      "/campaign-simulation",
      {
        params: {
          workspace_id: workspaceId,
        },
      }
    );

    return normalizePayload(
      data,
      workspaceId
    );
  } catch (error) {
    console.error(
      "[Campaign Simulation] Load Failed",
      error?.response?.data ||
        error?.message ||
        error
    );

    return normalizePayload(
      {
        ...fallbackCampaignSimulation,

        source: "api-fallback",
      },
      workspaceId
    );
  }
}

/* =====================================================
   SEED
===================================================== */

export async function seedCampaignSimulation(
  workspaceId = 1
) {
  try {
    const { data } = await api.post(
      "/campaign-simulation/seed",

      {},

      {
        params: {
          workspace_id: workspaceId,
        },
      }
    );

    return data;
  } catch (error) {
    console.error(
      "[Campaign Simulation] Seed Failed",
      error?.response?.data ||
        error?.message ||
        error
    );

    return {
      ok: false,

      error:
        "Seed endpoint unavailable.",
    };
  }
}

/* =====================================================
   RUN EXECUTIVE SIMULATION
===================================================== */

export async function runCampaignSimulation(
  payload,
  workspaceId = 1
) {
  try {
    const { data } = await api.post(
      "/campaign-simulation/run",

      payload,

      {
        params: {
          workspace_id: workspaceId,
        },
      }
    );

    return data;
  } catch (error) {
    console.error(
      "[Campaign Simulation] Run Failed",
      error?.response?.data ||
        error?.message ||
        error
    );

    return {
      ok: false,

      error:
        "Simulation engine unavailable.",
    };
  }
}

/* =====================================================
   HEALTH
===================================================== */

export async function getCampaignSimulationHealth() {
  try {
    const { data } = await api.get(
      "/campaign-simulation/health"
    );

    return data;
  } catch (error) {
    console.error(
      "[Campaign Simulation] Health Failed",
      error?.response?.data ||
        error?.message ||
        error
    );

    return {
      ok: false,

      service:
        "Predictive Campaign Simulation",

      error:
        "Health endpoint unavailable.",
    };
  }
}
