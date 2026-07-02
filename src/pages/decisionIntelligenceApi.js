import { api } from "../services/api";

/**
 * Fetch Executive Decision Intelligence
 */
export async function fetchDecisionIntelligence(workspaceId = 1) {
  try {
    const { data } = await api.get("/decision-intelligence", {
      params: {
        workspace_id: workspaceId,
      },
    });

    return data;
  } catch (error) {
    console.error(
      "[Decision Intelligence] Failed to load:",
      error.response?.data || error.message
    );

    // Fallback demo data so the page never crashes
    return {
      executiveSummary: {
        recommendation: "Monitor battleground activity and increase field operations.",
        confidence: 91,
        risk: 28,
        urgency: "High",
      },

      recommendations: [
        {
          id: 1,
          title: "Increase Ground Operations",
          priority: "High",
          confidence: 91,
          impact: 87,
          risk: 28,
          status: "Open",
        },
        {
          id: 2,
          title: "Expand Digital Advertising",
          priority: "Medium",
          confidence: 82,
          impact: 74,
          risk: 34,
          status: "Open",
        },
        {
          id: 3,
          title: "Strengthen Donor Outreach",
          priority: "Medium",
          confidence: 78,
          impact: 69,
          risk: 18,
          status: "Planning",
        },
      ],

      signals: [
        {
          title: "Polling Shift",
          severity: "Medium",
          source: "Forecast Engine",
        },
        {
          title: "Fundraising Surge",
          severity: "Low",
          source: "Finance Intelligence",
        },
        {
          title: "Volunteer Growth",
          severity: "Low",
          source: "Operations",
        },
      ],
    };
  }
}

/**
 * Seed demo data
 */
export async function seedDecisionIntelligence(workspaceId = 1) {
  try {
    const { data } = await api.post(
      "/decision-intelligence/seed",
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
      "[Decision Intelligence] Seed failed:",
      error.response?.data || error.message
    );

    return {
      success: false,
    };
  }
}
