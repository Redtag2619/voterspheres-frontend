import { api } from "../services/api";

const clean = (value = "") => String(value ?? "").trim();

function optionalWorkspaceId(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeScopeInput(input = null) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return {
      workspaceId: optionalWorkspaceId(
        input.workspaceId ?? input.workspace_id ?? null
      ),
      state: clean(input.state),
      office: clean(input.office),
      risk: clean(input.risk),
    };
  }

  return {
    workspaceId: optionalWorkspaceId(input),
    state: "",
    office: "",
    risk: "",
  };
}

function normalizeSummary(summary = {}) {
  const source = summary && typeof summary === "object" ? summary : {};

  return {
    openDecisions: Number(source.openDecisions ?? 0),
    highPriority: Number(source.highPriority ?? 0),
    avgConfidence: Number(source.avgConfidence ?? 0),
    avgRisk: Number(source.avgRisk ?? 0),
    liveSignals: Number(source.liveSignals ?? 0),
    totalDecisions: Number(source.totalDecisions ?? source.openDecisions ?? 0),
    criticalDecisions: Number(source.criticalDecisions ?? 0),
    materialSignals: Number(source.materialSignals ?? 0),
    scopedSignals: Number(source.scopedSignals ?? 0),
    sourceCount: Number(source.sourceCount ?? 0),
    availableSources: Number(source.availableSources ?? 0),
    degradedSources: Number(source.degradedSources ?? 0),
    unavailableSources: Number(source.unavailableSources ?? 0),
  };
}

function normalizePayload(payload, requestedScope = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Decision Intelligence returned an invalid response.");
  }

  if (payload.ok === false) {
    throw new Error(
      clean(payload.error || payload.message) ||
        "Decision Intelligence request failed."
    );
  }

  const workspaceId =
    optionalWorkspaceId(payload.workspace_id) ??
    optionalWorkspaceId(payload.scope?.workspace_id) ??
    optionalWorkspaceId(requestedScope.workspaceId);

  return {
    ...payload,
    ok: true,
    workspace_id: workspaceId,
    build: clean(payload.build),
    mode: clean(payload.mode),
    source: clean(payload.source),
    generated_at: payload.generated_at || null,
    firm_id: payload.firm_id ?? payload.scope?.firm_id ?? null,
    scope:
      payload.scope && typeof payload.scope === "object" ? payload.scope : {},
    summary: normalizeSummary(payload.summary),
    briefing:
      payload.briefing && typeof payload.briefing === "object"
        ? payload.briefing
        : {},
    decisions: Array.isArray(payload.decisions) ? payload.decisions : [],
    signals: Array.isArray(payload.signals) ? payload.signals : [],
    evidence:
      payload.evidence && typeof payload.evidence === "object"
        ? payload.evidence
        : {},
    context:
      payload.context && typeof payload.context === "object"
        ? payload.context
        : {},
  };
}

function requestParams(scope) {
  const params = {};

  if (scope.workspaceId) params.workspace_id = scope.workspaceId;
  if (scope.state) params.state = scope.state;
  if (scope.office) params.office = scope.office;
  if (scope.risk) params.risk = scope.risk;

  return params;
}

function decisionIntelligenceError(error) {
  const serverMessage = clean(
    error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message
  );

  const wrapped = new Error(
    serverMessage || "Unable to load Executive Decision Intelligence."
  );

  wrapped.status = error?.response?.status || null;
  wrapped.data = error?.response?.data || null;
  wrapped.cause = error;

  return wrapped;
}

export async function fetchDecisionIntelligence(scopeInput = null) {
  const scope = normalizeScopeInput(scopeInput);

  try {
    const { data } = await api.get("/decision-intelligence", {
      params: requestParams(scope),
    });

    return normalizePayload(data, scope);
  } catch (error) {
    const wrapped = decisionIntelligenceError(error);

    console.error("[Decision Intelligence] Load failed:", {
      status: wrapped.status,
      message: wrapped.message,
      data: wrapped.data,
    });

    throw wrapped;
  }
}

/**
 * Live Decision Intelligence 2.0 does not use seed/demo records.
 * This compatibility export remains temporarily so older page code can build
 * until the Executive Decision Intelligence page replacement is installed.
 */
export async function seedDecisionIntelligence() {
  return {
    ok: false,
    disabled: true,
    status: 410,
    error:
      "Decision Intelligence seed mode is disabled. Live authoritative synthesis is active.",
  };
}
