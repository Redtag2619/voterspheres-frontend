import { api } from "../services/api";

/*
 * =========================================================
 * VoterSpheres Build 4.1 Part 1
 * Executive Intelligence Orchestrator API
 * =========================================================
 *
 * Supports:
 * - ExecutiveAICommandPlatform.jsx
 * - Grounded intelligence responses
 * - Live evidence status
 * - Provider diagnostics
 * - Source extraction
 * - Backward-compatible API aliases
 */

const BUILD = "4.1.0";

const BASE_ENDPOINT =
  "/executive-intelligence-orchestrator";

const DEFAULT_WORKSPACE_ID = 1;
const DEFAULT_LIMIT = 12;

/*
 * ---------------------------------------------------------
 * General helpers
 * ---------------------------------------------------------
 */

function clean(value = "") {
  return String(value ?? "").trim();
}

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function asObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function clamp(
  value,
  fallback = 0,
  min = 0,
  max = 100
) {
  const parsed =
    asNumber(value, fallback);

  return Math.min(
    max,
    Math.max(
      min,
      parsed
    )
  );
}

function firstDefined(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}

function unwrapResponse(response) {
  return (
    response?.data?.data ??
    response?.data ??
    response ??
    {}
  );
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      asArray(values)
        .flat()
        .map((value) =>
          clean(value)
        )
        .filter(Boolean)
    ),
  ];
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toISOString();
}

/*
 * ---------------------------------------------------------
 * Error normalization
 * ---------------------------------------------------------
 */

function normalizeApiError(error) {
  const responseData =
    error?.response?.data ||
    {};

  const message =
    clean(
      responseData.error ||
      responseData.detail ||
      responseData.message ||
      error?.message
    ) ||
    "Executive Intelligence request failed.";

  const normalized =
    new Error(message);

  normalized.status =
    error?.response?.status ||
    error?.status ||
    500;

  normalized.code =
    responseData.code ||
    error?.code ||
    "EXECUTIVE_INTELLIGENCE_REQUEST_FAILED";

  normalized.details =
    responseData;

  normalized.originalError =
    error;

  return normalized;
}

/*
 * ---------------------------------------------------------
 * Source normalization
 * ---------------------------------------------------------
 */

function normalizeSource(
  source,
  index = 0
) {
  if (
    typeof source ===
    "string"
  ) {
    return {
      id:
        `source-${index + 1}`,

      name:
        source,

      source,

      provider:
        null,

      url:
        null,

      source_url:
        null,

      published_at:
        null,

      field_start:
        null,

      field_end:
        null,

      reporting_period:
        null,

      freshness:
        null,

      confidence:
        null,

      tool:
        null,
    };
  }

  const item =
    asObject(source);

  const name =
    clean(
      item.name ||
      item.source ||
      item.publisher ||
      item.provider ||
      item.label
    ) ||
    `Source ${index + 1}`;

  const url =
    clean(
      item.url ||
      item.source_url ||
      item.link
    ) ||
    null;

  return {
    ...item,

    id:
      item.id ||
      `source-${index + 1}`,

    name,

    source:
      clean(
        item.source ||
        name
      ),

    provider:
      clean(
        item.provider ||
        item.publisher
      ) ||
      null,

    url,

    source_url:
      url,

    published_at:
      normalizeDate(
        item.published_at ||
        item.publication_date ||
        item.date
      ),

    field_start:
      normalizeDate(
        item.field_start
      ),

    field_end:
      normalizeDate(
        item.field_end
      ),

    reporting_period:
      firstDefined(
        item.reporting_period,
        item.coverage_through_date,
        item.coverage_end_date,
        null
      ),

    freshness:
      firstDefined(
        item.freshness,
        item.source_freshness,
        null
      ),

    confidence:
      item.confidence ===
      undefined
        ? null
        : clamp(
            item.confidence,
            0
          ),

    tool:
      clean(
        item.tool
      ) ||
      null,
  };
}

function normalizeSources(value) {
  return asArray(value)
    .map(
      normalizeSource
    )
    .filter(
      (source) =>
        source.name ||
        source.url
    );
}

/*
 * ---------------------------------------------------------
 * Diagnostic normalization
 * ---------------------------------------------------------
 */

function normalizeDiagnostic(
  diagnostic,
  index = 0
) {
  const item =
    asObject(
      diagnostic
    );

  return {
    ...item,

    id:
      item.id ||
      `diagnostic-${index + 1}`,

    provider:
      clean(
        item.provider ||
        item.service ||
        item.tool
      ) ||
      "Unknown provider",

    tool:
      clean(
        item.tool
      ) ||
      null,

    ok:
      Boolean(
        item.ok
      ),

    degraded:
      Boolean(
        item.degraded
      ),

    cached:
      Boolean(
        item.cached
      ),

    stale:
      Boolean(
        item.stale
      ),

    timed_out:
      Boolean(
        item.timed_out
      ),

    latency_ms:
      asNumber(
        item.latency_ms,
        0
      ),

    item_count:
      asNumber(
        item.item_count,
        0
      ),

    error:
      clean(
        item.error ||
        item.message
      ) ||
      null,

    checked_at:
      normalizeDate(
        item.checked_at ||
        item.generated_at
      ),
  };
}

function normalizeDiagnostics(value) {
  return asArray(value)
    .map(
      normalizeDiagnostic
    );
}

/*
 * ---------------------------------------------------------
 * Tool-result normalization
 * ---------------------------------------------------------
 */

function hasMeaningfulData(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  if (
    Array.isArray(value)
  ) {
    return value.length > 0;
  }

  if (
    typeof value ===
    "string"
  ) {
    return Boolean(
      clean(value)
    );
  }

  if (
    typeof value ===
    "number" ||
    typeof value ===
    "boolean"
  ) {
    return true;
  }

  if (
    typeof value ===
    "object"
  ) {
    return Object.values(value)
      .some(
        hasMeaningfulData
      );
  }

  return false;
}

function normalizeToolResult(
  result,
  index = 0
) {
  const item =
    asObject(result);

  const sources =
    normalizeSources(
      item.sources
    );

  const diagnostics =
    normalizeDiagnostics(
      item.diagnostics
    );

  const warnings =
    uniqueStrings(
      item.warnings
    );

  const data =
    item.data === undefined
      ? null
      : item.data;

  const meaningful =
    item.meaningful !==
    undefined
      ? Boolean(
          item.meaningful
        )
      : Boolean(
          item.ok &&
          (
            sources.length ||
            clean(
              item.summary
            ) ||
            hasMeaningfulData(
              data
            )
          )
        );

  return {
    ...item,

    id:
      item.id ||
      `tool-result-${index + 1}`,

    tool:
      clean(
        item.tool ||
        item.name
      ) ||
      `tool-${index + 1}`,

    reason:
      clean(
        item.reason
      ) ||
      null,

    ok:
      Boolean(
        item.ok
      ),

    meaningful,

    degraded:
      Boolean(
        item.degraded
      ),

    cached:
      Boolean(
        item.cached
      ),

    stale:
      Boolean(
        item.stale
      ),

    summary:
      clean(
        item.summary
      ),

    data,

    sources,

    warnings,

    diagnostics,

    latency_ms:
      asNumber(
        item.latency_ms,
        0
      ),

    generated_at:
      normalizeDate(
        item.generated_at ||
        item.fetched_at
      ),
  };
}

function normalizeToolResults(value) {
  return asArray(value)
    .map(
      normalizeToolResult
    );
}

/*
 * ---------------------------------------------------------
 * Briefing normalization
 * ---------------------------------------------------------
 */

function normalizeFinding(
  finding,
  index = 0
) {
  if (
    typeof finding ===
    "string"
  ) {
    return {
      rank:
        index + 1,

      finding,

      support:
        null,
    };
  }

  const item =
    asObject(
      finding
    );

  return {
    ...item,

    rank:
      asNumber(
        item.rank,
        index + 1
      ),

    finding:
      clean(
        item.finding ||
        item.text ||
        item.summary
      ),

    support:
      clean(
        item.support ||
        item.tool ||
        item.source
      ) ||
      null,
  };
}

function normalizeRisk(
  risk,
  index = 0
) {
  if (
    typeof risk ===
    "string"
  ) {
    return {
      id:
        `risk-${index + 1}`,

      tool:
        null,

      issue:
        risk,
    };
  }

  const item =
    asObject(risk);

  return {
    ...item,

    id:
      item.id ||
      `risk-${index + 1}`,

    tool:
      clean(
        item.tool ||
        item.provider
      ) ||
      null,

    issue:
      clean(
        item.issue ||
        item.error ||
        item.warning ||
        item.summary
      ),
  };
}

function normalizeBriefing(
  briefingValue,
  fallbackValue = {}
) {
  const briefing =
    asObject(
      briefingValue
    );

  const fallback =
    asObject(
      fallbackValue
    );

  const keyFindings =
    asArray(
      firstDefined(
        briefing.key_findings,
        briefing.findings,
        fallback.key_findings,
        []
      )
    )
      .map(
        normalizeFinding
      )
      .filter(
        (item) =>
          item.finding
      );

  const risksAndGaps =
    asArray(
      firstDefined(
        briefing.risks_and_gaps,
        briefing.risks,
        briefing.gaps,
        fallback.risks_and_gaps,
        []
      )
    )
      .map(
        normalizeRisk
      )
      .filter(
        (item) =>
          item.issue
      );

  const recommendedActions =
    uniqueStrings(
      firstDefined(
        briefing.recommended_actions,
        briefing.actions,
        fallback.recommended_actions,
        []
      )
    );

  return {
    ...briefing,

    headline:
      clean(
        firstDefined(
          briefing.headline,
          fallback.headline,
          ""
        )
      ),

    executive_summary:
      clean(
        firstDefined(
          briefing.executive_summary,
          briefing.strategic_summary,
          briefing.summary,
          fallback.executive_summary,
          ""
        )
      ),

    key_findings:
      keyFindings,

    risks_and_gaps:
      risksAndGaps,

    recommended_actions:
      recommendedActions,

    answer:
      clean(
        firstDefined(
          briefing.answer,
          fallback.answer,
          briefing.executive_summary,
          briefing.strategic_summary,
          briefing.summary,
          ""
        )
      ),
  };
}

/*
 * ---------------------------------------------------------
 * Coverage normalization
 * ---------------------------------------------------------
 */

function normalizeCoverage(
  coverageValue,
  toolResults
) {
  const coverage =
    asObject(
      coverageValue
    );

  const attemptedTools =
    asNumber(
      firstDefined(
        coverage.attempted_tools,
        coverage.attemptedTools,
        toolResults.length
      ),
      toolResults.length
    );

  const successfulTools =
    asNumber(
      firstDefined(
        coverage.successful_tools,
        coverage.successfulTools,
        toolResults.filter(
          (tool) =>
            tool.ok
        ).length
      ),
      0
    );

  const usefulTools =
    asNumber(
      firstDefined(
        coverage.useful_tools,
        coverage.meaningful_tools,
        coverage.usefulTools,
        toolResults.filter(
          (tool) =>
            tool.meaningful
        ).length
      ),
      0
    );

  const degradedTools =
    asNumber(
      firstDefined(
        coverage.degraded_tools,
        coverage.degradedTools,
        toolResults.filter(
          (tool) =>
            tool.degraded
        ).length
      ),
      0
    );

  const failedTools =
    Math.max(
      0,
      attemptedTools -
      successfulTools
    );

  const calculatedScore =
    attemptedTools
      ? Math.round(
          (
            usefulTools /
            attemptedTools
          ) *
          100
        )
      : 0;

  return {
    ...coverage,

    attempted_tools:
      attemptedTools,

    successful_tools:
      successfulTools,

    useful_tools:
      usefulTools,

    meaningful_tools:
      usefulTools,

    degraded_tools:
      degradedTools,

    failed_tools:
      failedTools,

    coverage_score:
      clamp(
        firstDefined(
          coverage.coverage_score,
          coverage.score,
          calculatedScore
        ),
        calculatedScore
      ),
  };
}

/*
 * ---------------------------------------------------------
 * Response extraction helpers required by the page
 * ---------------------------------------------------------
 */

export function extractExecutiveAnswer(
  result = {}
) {
  const data =
    asObject(result);

  const briefing =
    asObject(
      data.briefing ||
      data.data?.briefing
    );

  return clean(
    firstDefined(
      data.answer,
      data.executive_summary,
      data.strategic_summary,
      data.summary,
      briefing.answer,
      briefing.executive_summary,
      briefing.strategic_summary,
      briefing.summary,
      data.message?.content,
      data.message,
      data.data?.answer,
      data.data?.executive_summary,
      data.data?.strategic_summary,
      data.data?.summary,
      data.data?.message?.content,
      ""
    )
  ) ||
  "The Executive Intelligence Orchestrator returned no readable response.";
}

export function extractExecutiveEvidence(
  result = {}
) {
  const data =
    asObject(result);

  const toolResults =
    normalizeToolResults(
      firstDefined(
        data.tool_results,
        data.evidence,
        data.results,
        data.data?.tool_results,
        data.data?.evidence,
        []
      )
    );

  const sources =
    normalizeSources(
      firstDefined(
        data.sources,
        data.citations,
        data.data?.sources,
        data.data?.citations,
        toolResults.flatMap(
          (tool) =>
            tool.sources
        ),
        []
      )
    );

  const diagnostics =
    normalizeDiagnostics(
      firstDefined(
        data.diagnostics,
        data.provider_diagnostics,
        data.data?.diagnostics,
        data.data?.provider_diagnostics,
        toolResults.flatMap(
          (tool) =>
            tool.diagnostics
        ),
        []
      )
    );

  const warnings =
    uniqueStrings([
      ...asArray(
        data.warnings
      ),

      ...asArray(
        data.data?.warnings
      ),

      ...toolResults.flatMap(
        (tool) =>
          tool.warnings
      ),
    ]);

  const coverage =
    normalizeCoverage(
      firstDefined(
        data.coverage,
        data.data?.coverage,
        {}
      ),
      toolResults
    );

  const meaningfulTools =
    toolResults.filter(
      (tool) =>
        tool.meaningful
    );

  const explicitLiveData =
    firstDefined(
      data.live_data_available,
      data.data?.live_data_available
    );

  const liveDataAvailable =
    explicitLiveData !==
    undefined
      ? Boolean(
          explicitLiveData
        )
      : Boolean(
          meaningfulTools.length ||
          sources.length
        );

  let evidenceStatus =
    clean(
      firstDefined(
        data.evidence_status,
        data.data?.evidence_status,
        ""
      )
    ).toLowerCase();

  if (
    ![
      "live",
      "partial",
      "degraded",
      "unavailable",
    ].includes(
      evidenceStatus
    )
  ) {
    if (
      !liveDataAvailable &&
      !meaningfulTools.length &&
      !sources.length
    ) {
      evidenceStatus =
        "unavailable";
    } else if (
      coverage.degraded_tools > 0 ||
      coverage.successful_tools <
      coverage.attempted_tools
    ) {
      evidenceStatus =
        "partial";
    } else {
      evidenceStatus =
        "live";
    }
  }

  return {
    live_data_available:
      liveDataAvailable,

    evidence_status:
      evidenceStatus,

    grounded:
      liveDataAvailable &&
      meaningfulTools.length > 0,

    sources,

    citations:
      sources,

    diagnostics,

    provider_diagnostics:
      diagnostics,

    warnings,

    coverage,

    tool_results:
      toolResults,

    evidence:
      toolResults,

    meaningful_tool_count:
      meaningfulTools.length,

    successful_provider_count:
      diagnostics.filter(
        (item) =>
          item.ok
      ).length,

    failed_provider_count:
      diagnostics.filter(
        (item) =>
          !item.ok
      ).length,

    degraded:
      evidenceStatus ===
      "partial" ||
      evidenceStatus ===
      "degraded" ||
      coverage.degraded_tools > 0,
  };
}

/*
 * ---------------------------------------------------------
 * Complete response normalization
 * ---------------------------------------------------------
 */

export function normalizeExecutiveIntelligenceResponse(
  payload = {}
) {
  const data =
    asObject(payload);

  const evidence =
    extractExecutiveEvidence(
      data
    );

  const briefing =
    normalizeBriefing(
      firstDefined(
        data.briefing,
        data.data?.briefing,
        {}
      ),
      data
    );

  const confidence =
    clamp(
      firstDefined(
        data.confidence,
        data.confidence_percentage,
        data.data?.confidence,
        data.data?.confidence_percentage,
        briefing.confidence,
        0
      ),
      0
    );

  const answer =
    extractExecutiveAnswer({
      ...data,
      briefing,
    });

  return {
    ...data,

    ok:
      data.ok !== false,

    build:
      clean(
        data.build ||
        BUILD
      ),

    service:
      clean(
        data.service ||
        "executive-intelligence-orchestrator"
      ),

    question:
      clean(
        firstDefined(
          data.question,
          data.context?.question,
          data.data?.question,
          ""
        )
      ),

    workspace_id:
      asNumber(
        firstDefined(
          data.workspace_id,
          data.workspaceId,
          data.data?.workspace_id,
          DEFAULT_WORKSPACE_ID
        ),
        DEFAULT_WORKSPACE_ID
      ),

    context:
      asObject(
        firstDefined(
          data.context,
          data.data?.context,
          {}
        )
      ),

    briefing,

    answer,

    headline:
      clean(
        firstDefined(
          data.headline,
          briefing.headline,
          ""
        )
      ),

    executive_summary:
      clean(
        firstDefined(
          data.executive_summary,
          briefing.executive_summary,
          ""
        )
      ),

    confidence,

    confidence_percentage:
      confidence,

    ...evidence,

    generated_at:
      normalizeDate(
        firstDefined(
          data.generated_at,
          data.data?.generated_at,
          new Date().toISOString()
        )
      ),
  };
}

/*
 * ---------------------------------------------------------
 * Request normalization
 * ---------------------------------------------------------
 */

function normalizeRequest(
  payload = {}
) {
  const data =
    asObject(payload);

  const question =
    clean(
      firstDefined(
        data.question,
        data.query,
        data.prompt,
        ""
      )
    );

  if (!question) {
    throw new Error(
      "An executive intelligence question is required."
    );
  }

  const workspaceId =
    asNumber(
      firstDefined(
        data.workspace_id,
        data.workspaceId,
        DEFAULT_WORKSPACE_ID
      ),
      DEFAULT_WORKSPACE_ID
    );

  const limit =
    Math.min(
      20,
      Math.max(
        1,
        asNumber(
          data.limit,
          DEFAULT_LIMIT
        )
      )
    );

  return {
    ...data,

    question,

    query:
      clean(
        data.query ||
        question
      ),

    prompt:
      clean(
        data.prompt ||
        question
      ),

    workspace_id:
      workspaceId,

    limit,

    state:
      clean(
        data.state
      ) ||
      null,

    office:
      clean(
        data.office
      ) ||
      null,

    candidate:
      clean(
        data.candidate ||
        data.candidate_name
      ) ||
      null,

    candidate_id:
      firstDefined(
        data.candidate_id,
        data.fec_candidate_id,
        null
      ),

    committee_id:
      firstDefined(
        data.committee_id,
        null
      ),

    cycle:
      clean(
        data.cycle
      ) ||
      null,

    locality:
      clean(
        data.locality ||
        data.county ||
        data.parish
      ) ||
      null,
  };
}

/*
 * ---------------------------------------------------------
 * Public endpoint methods
 * ---------------------------------------------------------
 */

export async function getExecutiveIntelligenceConfig() {
  try {
    const response =
      await api.get(
        `${BASE_ENDPOINT}/config`
      );

    const result =
      unwrapResponse(
        response
      );

    return {
      ...asObject(result),

      ok:
        result?.ok !== false,

      build:
        clean(
          result?.build ||
          BUILD
        ),

      service:
        "executive-intelligence-orchestrator",

      openai_synthesis_configured:
        Boolean(
          result?.openai_synthesis_configured
        ),

      max_tools:
        asNumber(
          result?.max_tools,
          0
        ),

      orchestrator_timeout_ms:
        asNumber(
          result?.orchestrator_timeout_ms,
          0
        ),

      tool_timeout_ms:
        asNumber(
          result?.tool_timeout_ms,
          0
        ),

      synthesis_timeout_ms:
        asNumber(
          result?.synthesis_timeout_ms,
          0
        ),

      generated_at:
        normalizeDate(
          result?.generated_at
        ),
    };
  } catch (error) {
    throw normalizeApiError(
      error
    );
  }
}

export async function planExecutiveIntelligence(
  payload = {}
) {
  try {
    const request =
      normalizeRequest(
        payload
      );

    const response =
      await api.post(
        `${BASE_ENDPOINT}/plan`,
        request
      );

    const result =
      unwrapResponse(
        response
      );

    return {
      ...asObject(result),

      ok:
        result?.ok !== false,

      build:
        clean(
          result?.build ||
          BUILD
        ),

      question:
        clean(
          result?.question ||
          request.question
        ),

      workspace_id:
        asNumber(
          result?.workspace_id,
          request.workspace_id
        ),

      context:
        asObject(
          result?.context
        ),

      tool_plan:
        asArray(
          result?.tool_plan
        ),

      generated_at:
        normalizeDate(
          result?.generated_at
        ),
    };
  } catch (error) {
    if (
      error?.code ===
      "EXECUTIVE_INTELLIGENCE_REQUEST_FAILED"
    ) {
      throw error;
    }

    throw normalizeApiError(
      error
    );
  }
}

export async function askExecutiveIntelligence(
  payload = {}
) {
  try {
    const request =
      normalizeRequest(
        payload
      );

    const response =
      await api.post(
        `${BASE_ENDPOINT}/brief`,
        request
      );

    return normalizeExecutiveIntelligenceResponse(
      unwrapResponse(
        response
      )
    );
  } catch (error) {
    throw normalizeApiError(
      error
    );
  }
}

/*
 * Build 4.1 page-compatible method.
 *
 * ExecutiveAICommandPlatform.jsx imports this name.
 */
export async function requestExecutiveIntelligenceBrief(
  payload = {}
) {
  return askExecutiveIntelligence(
    payload
  );
}

/*
 * Compatibility aliases.
 */

export async function runExecutiveIntelligenceBrief(
  payload = {}
) {
  return askExecutiveIntelligence(
    payload
  );
}

export async function inspectExecutiveIntelligence(
  payload = {}
) {
  const request =
    normalizeRequest(
      payload
    );

  const [
    config,
    plan,
    briefing,
  ] =
    await Promise.all([
      getExecutiveIntelligenceConfig(),

      planExecutiveIntelligence(
        request
      ),

      askExecutiveIntelligence(
        request
      ),
    ]);

  return {
    ok:
      Boolean(
        briefing.ok
      ),

    build:
      BUILD,

    config,

    plan,

    briefing,

    live_data_available:
      Boolean(
        briefing.live_data_available
      ),

    evidence_status:
      briefing.evidence_status,

    generated_at:
      new Date().toISOString(),
  };
}

export default {
  getExecutiveIntelligenceConfig,
  planExecutiveIntelligence,
  askExecutiveIntelligence,
  requestExecutiveIntelligenceBrief,
  runExecutiveIntelligenceBrief,
  inspectExecutiveIntelligence,
  extractExecutiveAnswer,
  extractExecutiveEvidence,
  normalizeExecutiveIntelligenceResponse,
};

