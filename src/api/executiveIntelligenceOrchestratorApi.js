import { api } from "../services/api";

/*
 * =========================================================
 * VoterSpheres Build 4.1 Part 1
 * Executive Intelligence Orchestrator API
 * =========================================================
 *
 * Purpose:
 * - Connect the Executive AI Command Platform to the
 *   grounded Executive Intelligence Orchestrator.
 * - Normalize backend responses into one predictable shape.
 * - Preserve live sources, warnings, provider diagnostics,
 *   coverage, confidence, and evidence status.
 * - Prevent unavailable live intelligence from appearing
 *   as a successful or authoritative political answer.
 */

const BUILD = "4.1.0";

const EXECUTIVE_INTELLIGENCE_ENDPOINT =
  "/executive-intelligence-orchestrator";

const DEFAULT_WORKSPACE_ID = 1;
const DEFAULT_LIMIT = 12;

/*
 * ---------------------------------------------------------
 * Basic helpers
 * ---------------------------------------------------------
 */

function clean(value = "") {
  return String(value ?? "").trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

function clampNumber(
  value,
  fallback = 0,
  min = 0,
  max = 100
) {
  const parsed = asNumber(
    value,
    fallback
  );

  return Math.min(
    max,
    Math.max(
      min,
      parsed
    )
  );
}

function firstValue(...values) {
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
      values
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

  return Number.isNaN(
    date.getTime()
  )
    ? value
    : date.toISOString();
}

/*
 * ---------------------------------------------------------
 * Error handling
 * ---------------------------------------------------------
 */

function extractApiError(error) {
  const responseData =
    error?.response?.data;

  const message =
    clean(
      responseData?.error ||
      responseData?.detail ||
      responseData?.message ||
      error?.message
    ) ||
    "Executive Intelligence request failed.";

  const normalizedError =
    new Error(message);

  normalizedError.status =
    error?.response?.status ||
    error?.status ||
    500;

  normalizedError.code =
    responseData?.code ||
    error?.code ||
    "EXECUTIVE_INTELLIGENCE_REQUEST_FAILED";

  normalizedError.details =
    responseData ||
    null;

  normalizedError.originalError =
    error;

  return normalizedError;
}

/*
 * ---------------------------------------------------------
 * Source normalization
 * ---------------------------------------------------------
 */

function normalizeSource(
  source = {},
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

      source:
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
      firstValue(
        item.reporting_period,
        item.coverage_through_date,
        item.coverage_end_date,
        null
      ),

    freshness:
      firstValue(
        item.freshness,
        item.source_freshness,
        null
      ),

    confidence:
      item.confidence ===
      undefined
        ? null
        : clampNumber(
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

function normalizeSources(
  value
) {
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
 * Diagnostics normalization
 * ---------------------------------------------------------
 */

function normalizeDiagnostic(
  diagnostic = {},
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
        item.tool ||
        item.service
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

    timed_out:
      Boolean(
        item.timed_out
      ),

    cached:
      Boolean(
        item.cached
      ),

    stale:
      Boolean(
        item.stale
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

function normalizeDiagnostics(
  value
) {
  return asArray(value)
    .map(
      normalizeDiagnostic
    );
}

/*
 * ---------------------------------------------------------
 * Tool result normalization
 * ---------------------------------------------------------
 */

function normalizeToolResult(
  result = {},
  index = 0
) {
  const item =
    asObject(result);

  const sources =
    normalizeSources(
      item.sources
    );

  const warnings =
    uniqueStrings(
      item.warnings
    );

  const diagnostics =
    normalizeDiagnostics(
      item.diagnostics
    );

  const data =
    item.data === undefined
      ? null
      : item.data;

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

    meaningful:
      item.meaningful !==
      undefined
        ? Boolean(
            item.meaningful
          )
        : Boolean(
            item.ok &&
            (
              sources.length ||
              data ||
              clean(
                item.summary
              )
            )
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

function normalizeToolResults(
  value
) {
  return asArray(value)
    .map(
      normalizeToolResult
    );
}

/*
 * ---------------------------------------------------------
 * Coverage and confidence
 * ---------------------------------------------------------
 */

function normalizeCoverage(
  value = {},
  toolResults = []
) {
  const coverage =
    asObject(value);

  const attemptedTools =
    asNumber(
      firstValue(
        coverage.attempted_tools,
        coverage.attemptedTools,
        toolResults.length
      ),
      toolResults.length
    );

  const successfulTools =
    asNumber(
      firstValue(
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
      firstValue(
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
      firstValue(
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
      clampNumber(
        firstValue(
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
 * Briefing normalization
 * ---------------------------------------------------------
 */

function normalizeFinding(
  finding = {},
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
  risk = {},
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
    asObject(
      risk
    );

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
  value = {},
  fallback = {}
) {
  const briefing =
    asObject(value);

  const fallbackData =
    asObject(fallback);

  const keyFindings =
    asArray(
      firstValue(
        briefing.key_findings,
        briefing.findings,
        fallbackData.key_findings,
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
      firstValue(
        briefing.risks_and_gaps,
        briefing.risks,
        briefing.gaps,
        fallbackData.risks_and_gaps,
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
      firstValue(
        briefing.recommended_actions,
        briefing.actions,
        fallbackData.recommended_actions,
        []
      )
    );

  return {
    ...briefing,

    headline:
      clean(
        firstValue(
          briefing.headline,
          fallbackData.headline,
          ""
        )
      ),

    executive_summary:
      clean(
        firstValue(
          briefing.executive_summary,
          briefing.strategic_summary,
          briefing.summary,
          fallbackData.executive_summary,
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
        firstValue(
          briefing.answer,
          fallbackData.answer,
          briefing.executive_summary,
          briefing.summary,
          ""
        )
      ),
  };
}

/*
 * ---------------------------------------------------------
 * Evidence-state logic
 * ---------------------------------------------------------
 */

function determineEvidenceStatus({
  backendStatus,
  liveDataAvailable,
  coverage,
  sources,
  toolResults,
}) {
  const explicitStatus =
    clean(
      backendStatus
    ).toLowerCase();

  if (
    [
      "live",
      "partial",
      "unavailable",
      "degraded",
    ].includes(
      explicitStatus
    )
  ) {
    return explicitStatus;
  }

  const meaningfulTools =
    toolResults.filter(
      (tool) =>
        tool.meaningful
    ).length;

  if (
    !liveDataAvailable &&
    meaningfulTools === 0 &&
    sources.length === 0
  ) {
    return "unavailable";
  }

  if (
    coverage.successful_tools <
      coverage.attempted_tools ||
    coverage.degraded_tools >
      0
  ) {
    return "partial";
  }

  if (
    liveDataAvailable &&
    meaningfulTools >
      0
  ) {
    return "live";
  }

  return "unavailable";
}

/*
 * ---------------------------------------------------------
 * Full response normalization
 * ---------------------------------------------------------
 */

export function normalizeExecutiveIntelligenceResponse(
  payload = {}
) {
  const data =
    asObject(
      payload
    );

  const toolResults =
    normalizeToolResults(
      firstValue(
        data.tool_results,
        data.results,
        data.evidence,
        data.data?.tool_results,
        []
      )
    );

  const sources =
    normalizeSources(
      firstValue(
        data.sources,
        data.citations,
        data.data?.sources,
        toolResults.flatMap(
          (tool) =>
            tool.sources
        ),
        []
      )
    );

  const diagnostics =
    normalizeDiagnostics(
      firstValue(
        data.diagnostics,
        data.provider_diagnostics,
        data.data?.diagnostics,
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
      firstValue(
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
    firstValue(
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

  const evidenceStatus =
    determineEvidenceStatus({
      backendStatus:
        firstValue(
          data.evidence_status,
          data.data?.evidence_status
        ),

      liveDataAvailable,

      coverage,

      sources,

      toolResults,
    });

  const briefing =
    normalizeBriefing(
      firstValue(
        data.briefing,
        data.data?.briefing,
        {}
      ),
      data
    );

  const confidence =
    clampNumber(
      firstValue(
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
    clean(
      firstValue(
        data.answer,
        briefing.answer,
        data.executive_summary,
        briefing.executive_summary,
        data.summary,
        ""
      )
    );

  const generatedAt =
    normalizeDate(
      firstValue(
        data.generated_at,
        data.data?.generated_at,
        new Date().toISOString()
      )
    );

  return {
    ...data,

    ok:
      Boolean(
        data.ok
      ),

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
        firstValue(
          data.question,
          data.context?.question,
          data.data?.question,
          ""
        )
      ),

    workspace_id:
      asNumber(
        firstValue(
          data.workspace_id,
          data.workspaceId,
          data.data?.workspace_id,
          DEFAULT_WORKSPACE_ID
        ),
        DEFAULT_WORKSPACE_ID
      ),

    context:
      asObject(
        firstValue(
          data.context,
          data.data?.context,
          {}
        )
      ),

    briefing,

    answer,

    executive_summary:
      clean(
        firstValue(
          data.executive_summary,
          briefing.executive_summary,
          ""
        )
      ),

    headline:
      clean(
        firstValue(
          data.headline,
          briefing.headline,
          ""
        )
      ),

    confidence,

    confidence_percentage:
      confidence,

    live_data_available:
      liveDataAvailable,

    evidence_status:
      evidenceStatus,

    grounded:
      liveDataAvailable &&
      meaningfulTools.length >
        0,

    coverage,

    sources,

    citations:
      sources,

    warnings,

    diagnostics,

    provider_diagnostics:
      diagnostics,

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
      coverage.degraded_tools >
        0,

    generated_at:
      generatedAt,
  };
}

/*
 * ---------------------------------------------------------
 * Request payload normalization
 * ---------------------------------------------------------
 */

function normalizeExecutiveRequest(
  payload = {}
) {
  const data =
    asObject(
      payload
    );

  const question =
    clean(
      firstValue(
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
      firstValue(
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
      firstValue(
        data.candidate_id,
        data.fec_candidate_id,
        null
      ),

    committee_id:
      firstValue(
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
 * Public API methods
 * ---------------------------------------------------------
 */

export async function getExecutiveIntelligenceConfig() {
  try {
    const response =
      await api.get(
        `${EXECUTIVE_INTELLIGENCE_ENDPOINT}/config`
      );

    const result =
      unwrapResponse(
        response
      );

    return {
      ...asObject(result),

      ok:
        result?.ok !==
        false,

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
    throw extractApiError(
      error
    );
  }
}

export async function planExecutiveIntelligence(
  payload = {}
) {
  try {
    const request =
      normalizeExecutiveRequest(
        payload
      );

    const response =
      await api.post(
        `${EXECUTIVE_INTELLIGENCE_ENDPOINT}/plan`,
        request
      );

    const result =
      unwrapResponse(
        response
      );

    return {
      ...asObject(result),

      ok:
        result?.ok !==
        false,

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

    throw extractApiError(
      error
    );
  }
}

export async function askExecutiveIntelligence(
  payload = {}
) {
  try {
    const request =
      normalizeExecutiveRequest(
        payload
      );

    const response =
      await api.post(
        `${EXECUTIVE_INTELLIGENCE_ENDPOINT}/brief`,
        request
      );

    const result =
      normalizeExecutiveIntelligenceResponse(
        unwrapResponse(
          response
        )
      );

    /*
     * A successful HTTP response does not automatically
     * mean that live political evidence was available.
     *
     * The UI should inspect:
     *
     * result.live_data_available
     * result.evidence_status
     * result.grounded
     * result.coverage
     * result.sources
     * result.diagnostics
     */
    return result;
  } catch (error) {
    throw extractApiError(
      error
    );
  }
}

/*
 * Alias retained for compatibility with older Executive AI
 * components that use "run" instead of "ask".
 */
export async function runExecutiveIntelligenceBrief(
  payload = {}
) {
  return askExecutiveIntelligence(
    payload
  );
}

/*
 * Optional helper for screens that need to test the complete
 * request flow without manually calling plan and brief.
 */
export async function inspectExecutiveIntelligence(
  payload = {}
) {
  const request =
    normalizeExecutiveRequest(
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
  runExecutiveIntelligenceBrief,
  inspectExecutiveIntelligence,
  normalizeExecutiveIntelligenceResponse,
};

