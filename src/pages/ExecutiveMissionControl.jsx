import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

/* ============================================================================
 * Executive Mission Control
 * Build 6 Mission Operations Integration
 *
 * Mission Control owns:
 * - Executive operating posture
 * - Cross-system mission pressure
 * - Ranked next-24-hour interventions
 * - Material operational exceptions
 * - Executive intelligence recommendations
 * - Handoffs into authoritative execution systems
 *
 * Mission Control does NOT replace:
 * - Command Center task execution
 * - Political Signals evidence
 * - Campaign CRM stakeholder records
 * - Vendor Network capacity records
 * - Rapid Response narrative workflows
 * ========================================================================== */

const PREVIEW_LIMIT = 3;
const MISSION_QUEUE_LIMIT = 6;

/* ============================================================================
 * Helpers
 * ========================================================================== */

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function number(value = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(value) {
  return number(value).toLocaleString();
}

function pct(value) {
  return `${Math.round(number(value))}%`;
}

function clean(value = "", fallback = "") {
  const normalized = String(value ?? "")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || fallback;
}

function lower(value = "") {
  return String(value ?? "").trim().toLowerCase();
}

function tone(value = "") {
  const normalized = lower(value);

  if (
    ["critical", "high", "danger", "severe", "overdue", "urgent"].some(
      (item) => normalized.includes(item)
    )
  ) {
    return "danger";
  }

  if (
    ["elevated", "medium", "watch", "gap", "open", "review"].some(
      (item) => normalized.includes(item)
    )
  ) {
    return "demo";
  }

  if (
    [
      "stable",
      "ready",
      "active",
      "complete",
      "completed",
      "resolved",
      "healthy",
    ].some((item) => normalized.includes(item))
  ) {
    return "active";
  }

  return "accent";
}

function formatTime(value) {
  if (!value) return "Ready";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Ready";
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasAny(value, terms = []) {
  const normalized = lower(value);
  return terms.some((term) => normalized.includes(term));
}

/* ============================================================================
 * Mission ranking
 *
 * Uses explicit backend scores where available, then falls back to textual
 * priority/risk/severity.
 *
 * This allows Mission Control to consume richer Build 6 mission objects
 * without breaking compatibility with the current backend.
 * ========================================================================== */

function textualPriorityRank(item = {}) {
  const priority = lower(
    item.priority ||
      item.risk ||
      item.severity ||
      item.threat_level ||
      item.status
  );

  if (
    priority.includes("critical") ||
    priority.includes("urgent") ||
    priority.includes("severe")
  ) {
    return 100;
  }

  if (priority.includes("high")) {
    return 80;
  }

  if (priority.includes("elevated")) {
    return 60;
  }

  if (priority.includes("medium") || priority.includes("watch")) {
    return 40;
  }

  if (priority.includes("low")) {
    return 20;
  }

  return 10;
}

function missionScore(item = {}) {
  const explicitScores = [
    item.mission_score,
    item.priority_score,
    item.urgency_score,
    item.pressure_score,
    item.risk_score,
    item.signal_score,
    item.score,
  ];

  for (const value of explicitScores) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return number(value);
    }
  }

  return textualPriorityRank(item);
}

function missionConfidence(item = {}) {
  const candidates = [
    item.confidence_score,
    item.confidence,
    item.evidence_confidence,
  ];

  for (const value of candidates) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function compareMissionItems(a = {}, b = {}) {
  const scoreDifference = missionScore(b) - missionScore(a);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  const priorityDifference =
    textualPriorityRank(b) - textualPriorityRank(a);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return missionConfidence(b) - missionConfidence(a);
}

/* ============================================================================
 * Routing
 *
 * Known authoritative VoterSpheres systems get explicit routes.
 * Unknown mission types safely fall back to Command Center.
 * ========================================================================== */

function routeForType(type = "") {
  const normalized = lower(type);

  if (
    hasAny(normalized, [
      "political signal",
      "signal",
      "political intelligence",
    ])
  ) {
    return "/political-signals";
  }

  if (
    hasAny(normalized, [
      "rapid response",
      "rapid",
      "narrative",
      "message response",
    ])
  ) {
    return "/narrative-response";
  }

  if (
    hasAny(normalized, [
      "crm",
      "stakeholder",
      "follow-up",
      "followup",
      "contact",
    ])
  ) {
    return "/campaign-crm";
  }

  if (
    hasAny(normalized, [
      "vendor",
      "capacity",
      "coverage gap",
    ])
  ) {
    return "/vendors";
  }

  if (
    hasAny(normalized, [
      "candidate intelligence",
      "candidate",
      "candidate briefing",
    ])
  ) {
    return "/candidates";
  }

  if (
    hasAny(normalized, [
      "strategy",
      "recommendation",
      "decision intelligence",
    ])
  ) {
    return "/command-center";
  }

  if (
    hasAny(normalized, [
      "task",
      "execution",
      "operation",
      "command",
      "workspace",
    ])
  ) {
    return "/command-center";
  }

  return "/command-center";
}

/* ============================================================================
 * Mission queue
 * ========================================================================== */

function MissionQueueRow({ item, index }) {
  const itemType = clean(
    item.type || item.category || item.source_type,
    "Mission item"
  );

  const score = missionScore(item);

  const meta = [
    {
      label: "Rank",
      value: index + 1,
    },
    {
      label: "Priority",
      value: clean(
        item.priority || item.risk || item.severity,
        "Monitor"
      ),
    },
    {
      label: "State",
      value: clean(item.state, "National"),
    },
    {
      label: "Source",
      value: clean(item.source, itemType),
    },
  ];

  if (score > 0) {
    meta.push({
      label: "Score",
      value: Math.round(score),
    });
  }

  return (
    <div className="emc-row">
      <ResponsiveRow
        title={clean(item.title, "Mission item")}
        subtitle={clean(
          item.description ||
            item.action ||
            item.summary ||
            item.recommendation,
          "Review the operating evidence and coordinate the response."
        )}
        meta={meta}
        right={
          <Link
            className="vs-button vs-button-secondary"
            to={routeForType(itemType)}
          >
            Open
          </Link>
        }
      />
    </div>
  );
}

/* ============================================================================
 * Exception row
 * ========================================================================== */

function ExceptionRow({
  title,
  description,
  label,
  value,
  route,
  badgeTone = "demo",
}) {
  return (
    <div className="emc-exception">
      <div className="emc-exception-copy">
        <span>{label}</span>

        <strong>{clean(title, "Operational exception")}</strong>

        <p>
          {clean(
            description,
            "Review the authoritative record for details."
          )}
        </p>
      </div>

      <div className="emc-exception-action">
        <Badge tone={badgeTone}>{clean(value, "Review")}</Badge>

        <Link to={route}>Review</Link>
      </div>
    </div>
  );
}

/* ============================================================================
 * AI recommendation row
 * ========================================================================== */

function IntelligenceRecommendationRow({ item, index }) {
  const title = clean(
    item.title ||
      item.recommendation_title ||
      item.name,
    `Executive recommendation ${index + 1}`
  );

  const description = clean(
    item.recommendation ||
      item.description ||
      item.summary ||
      item.rationale ||
      item.action,
    "Review the supporting intelligence and determine whether executive action is required."
  );

  const priority = clean(
    item.priority ||
      item.risk ||
      item.severity ||
      item.urgency,
    "Review"
  );

  const sourceType = clean(
    item.type ||
      item.category ||
      item.source_type,
    "strategy recommendation"
  );

  return (
    <article className="emc-intelligence-item">
      <div className="emc-intelligence-head">
        <div>
          <span>Executive Intelligence</span>
          <strong>{title}</strong>
        </div>

        <Badge tone={tone(priority)}>
          {priority}
        </Badge>
      </div>

      <p>{description}</p>

      <div className="emc-intelligence-footer">
        <span>
          Mission score: {Math.round(missionScore(item))}
        </span>

        <Link to={routeForType(sourceType)}>
          Review operating context
        </Link>
      </div>
    </article>
  );
}

/* ============================================================================
 * Component
 * ========================================================================== */

export default function ExecutiveMissionControl() {
  const [data, setData] = useState({
    summary: {},
    mission_items: [],
    critical_signals: [],
    open_tasks: [],
    rapid_responses: [],
    crm_followups: [],
    workspace_health: [],
    vendor_gaps: [],
    ai_recommendations: [],
    updated_at: "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* ==========================================================================
   * Data loading
   * ======================================================================== */

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result = await api.executiveMissionControl();

      setData({
        summary: result?.summary || {},
        mission_items: arr(result?.mission_items),
        critical_signals: arr(result?.critical_signals),
        open_tasks: arr(result?.open_tasks),
        rapid_responses: arr(result?.rapid_responses),
        crm_followups: arr(result?.crm_followups),
        workspace_health: arr(result?.workspace_health),
        vendor_gaps: arr(result?.vendor_gaps),
        ai_recommendations: arr(result?.ai_recommendations),
        updated_at:
          result?.updated_at || new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load Executive Mission Control."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();

    const interval = window.setInterval(
      () => load({ quiet: true }),
      30000
    );

    return () => window.clearInterval(interval);
  }, [load]);

  /* ==========================================================================
   * Source collections
   * ======================================================================== */

  const summary = data.summary || {};

  const missionItems = arr(data.mission_items);
  const criticalSignals = arr(data.critical_signals);
  const openTasks = arr(data.open_tasks);
  const rapidResponses = arr(data.rapid_responses);
  const crmFollowups = arr(data.crm_followups);
  const workspaceHealth = arr(data.workspace_health);
  const vendorGaps = arr(data.vendor_gaps);
  const aiRecommendations = arr(data.ai_recommendations);

  /* ==========================================================================
   * Mission queue ranking
   * ======================================================================== */

  const rankedMissionItems = useMemo(
    () =>
      missionItems
        .slice()
        .sort(compareMissionItems)
        .slice(0, MISSION_QUEUE_LIMIT),
    [missionItems]
  );

  /* ==========================================================================
   * Full exception collections
   *
   * IMPORTANT:
   * These remain unsliced so counts represent authoritative totals.
   * Preview collections below are sliced only for display.
   * ======================================================================== */

  const allAtRiskWorkspaces = useMemo(
    () =>
      workspaceHealth
        .filter((item) =>
          ["critical", "high", "elevated"].includes(
            lower(item.risk)
          )
        )
        .slice()
        .sort(
          (a, b) =>
            number(b.pressure_score) -
            number(a.pressure_score)
        ),
    [workspaceHealth]
  );

  const allRiskDrivingSignals = useMemo(
    () =>
      criticalSignals
        .slice()
        .sort(
          (a, b) =>
            number(
              b.signal_score ??
                b.risk_score ??
                b.score
            ) -
            number(
              a.signal_score ??
                a.risk_score ??
                a.score
            )
        ),
    [criticalSignals]
  );

  const allActiveEscalations = useMemo(
    () =>
      rapidResponses
        .slice()
        .sort(
          (a, b) =>
            missionScore(b) - missionScore(a)
        ),
    [rapidResponses]
  );

  const allCriticalVendorGaps = useMemo(
    () =>
      vendorGaps
        .slice()
        .sort(
          (a, b) =>
            missionScore(b) - missionScore(a)
        ),
    [vendorGaps]
  );

  /* ==========================================================================
   * Display previews
   * ======================================================================== */

  const atRiskWorkspaces = useMemo(
    () => allAtRiskWorkspaces.slice(0, PREVIEW_LIMIT),
    [allAtRiskWorkspaces]
  );

  const riskDrivingSignals = useMemo(
    () => allRiskDrivingSignals.slice(0, PREVIEW_LIMIT),
    [allRiskDrivingSignals]
  );

  const activeEscalations = useMemo(
    () => allActiveEscalations.slice(0, PREVIEW_LIMIT),
    [allActiveEscalations]
  );

  const criticalVendorGaps = useMemo(
    () => allCriticalVendorGaps.slice(0, PREVIEW_LIMIT),
    [allCriticalVendorGaps]
  );

  const rankedAiRecommendations = useMemo(
    () =>
      aiRecommendations
        .slice()
        .sort(compareMissionItems)
        .slice(0, PREVIEW_LIMIT),
    [aiRecommendations]
  );

  /* ==========================================================================
   * Executive totals
   * ======================================================================== */

  const pressureScore = number(summary.pressure_score);

  const missionRisk = clean(
    summary.mission_risk,
    "Stable"
  );

  const exceptionCount =
    allAtRiskWorkspaces.length +
    allRiskDrivingSignals.length +
    allActiveEscalations.length +
    allCriticalVendorGaps.length;

  const displayedExceptionCount =
    atRiskWorkspaces.length +
    riskDrivingSignals.length +
    activeEscalations.length +
    criticalVendorGaps.length;

  const recommendationCount =
    number(summary.ai_recommendations) ||
    aiRecommendations.length;

  /* ==========================================================================
   * Authoritative-system handoffs
   * ======================================================================== */

  const handoffs = [
    {
      label: "Command Center",
      detail: "Execution ownership and completion",
      count:
        number(summary.open_tasks) ||
        openTasks.length,
      route: "/command-center",
      countLabel: "open tasks",
    },
    {
      label: "Political Signals",
      detail: "Evidence and signal investigation",
      count:
        number(summary.critical_signals) ||
        criticalSignals.length,
      route: "/political-signals",
      countLabel: "critical signals",
    },
    {
      label: "Rapid Response",
      detail: "Narrative response development",
      count:
        number(summary.rapid_responses) ||
        rapidResponses.length,
      route: "/narrative-response",
      countLabel: "active responses",
    },
    {
      label: "Campaign CRM",
      detail: "Stakeholder follow-up records",
      count:
        number(summary.crm_followups) ||
        crmFollowups.length,
      route: "/campaign-crm",
      countLabel: "follow-ups",
    },
    {
      label: "Vendor Network",
      detail: "Capacity and coverage management",
      count:
        number(summary.vendor_gaps) ||
        vendorGaps.length,
      route: "/vendors",
      countLabel: "coverage gaps",
    },
  ];

  /* ==========================================================================
   * Render
   * ======================================================================== */

  return (
    <PageShell
      eyebrow="Executive Mission Control"
      title="Mission Control"
      description="The next-24-hours operating center for mission readiness, ranked interventions, executive intelligence and exceptions requiring coordinated action."
      tickerItems={[
        {
          label: "Mission Risk",
          value: missionRisk,
          dotClass:
            ["critical", "high"].includes(
              lower(missionRisk)
            )
              ? "vs-live-dot-warning"
              : "vs-live-dot-success",
        },
        {
          label: "Pressure",
          value: pct(pressureScore),
          dotClass:
            pressureScore >= 65
              ? "vs-live-dot-warning"
              : "vs-live-dot-success",
        },
        {
          label: "Exceptions",
          value: String(exceptionCount),
          dotClass: exceptionCount
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing
            ? "Refreshing"
            : formatTime(data.updated_at),
          dotClass: refreshing
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .emc-command {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 22px;
          align-items: center;
          margin-bottom: 18px;
          padding: 24px;
          border: 1px solid rgba(251, 146, 60, 0.28);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at top right,
              rgba(251, 146, 60, 0.15),
              transparent 34%
            ),
            linear-gradient(
              135deg,
              rgba(15, 23, 42, 0.94),
              rgba(2, 6, 23, 0.84)
            );
        }

        .emc-command span,
        .emc-exception-copy span,
        .emc-handoff-copy span,
        .emc-intelligence-head span {
          color: var(--vs-brand-orange, #fb923c);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .emc-command h2 {
          margin: 7px 0 8px;
          color: var(--vs-text, #f8fafc);
          font-size: clamp(24px, 3vw, 38px);
          line-height: 1.12;
        }

        .emc-command p {
          margin: 0;
          max-width: 760px;
          color: var(--vs-text-muted, #94a3b8);
          line-height: 1.65;
        }

        .emc-command-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .emc-metrics {
          margin-bottom: 18px;
        }

        .emc-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1.3fr)
            minmax(320px, 0.7fr);
          gap: 18px;
          align-items: start;
        }

        .emc-stack {
          display: grid;
          gap: 14px;
        }

        .emc-row {
          min-width: 0;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          overflow: hidden;
        }

        .emc-row .vs-card-muted {
          border: 0;
          background: rgba(15, 23, 42, 0.44);
        }

        .emc-exception {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          padding: 15px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 17px;
          background: rgba(15, 23, 42, 0.52);
        }

        .emc-exception-copy {
          min-width: 0;
        }

        .emc-exception-copy strong {
          display: block;
          margin-top: 5px;
          color: var(--vs-text, #f8fafc);
          font-size: 14px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .emc-exception-copy p {
          margin: 5px 0 0;
          color: var(--vs-text-muted, #94a3b8);
          font-size: 12px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .emc-exception-action {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .emc-exception-action a {
          color: #bfdbfe;
          font-size: 11px;
          font-weight: 900;
          text-decoration: none;
        }

        .emc-exception-action a:hover {
          color: white;
        }

        .emc-intelligence-section {
          margin-top: 18px;
        }

        .emc-intelligence-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .emc-intelligence-item {
          display: flex;
          min-width: 0;
          min-height: 190px;
          flex-direction: column;
          justify-content: space-between;
          gap: 14px;
          padding: 18px;
          border: 1px solid rgba(96, 165, 250, 0.2);
          border-radius: 19px;
          background:
            radial-gradient(
              circle at top right,
              rgba(59, 130, 246, 0.1),
              transparent 38%
            ),
            rgba(15, 23, 42, 0.52);
        }

        .emc-intelligence-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .emc-intelligence-head > div {
          min-width: 0;
        }

        .emc-intelligence-head strong {
          display: block;
          margin-top: 6px;
          color: var(--vs-text, #f8fafc);
          font-size: 15px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .emc-intelligence-item p {
          margin: 0;
          color: var(--vs-text-muted, #94a3b8);
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .emc-intelligence-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }

        .emc-intelligence-footer span {
          color: var(--vs-text-muted, #94a3b8);
          font-size: 10px;
          font-weight: 800;
        }

        .emc-intelligence-footer a {
          color: #bfdbfe;
          font-size: 11px;
          font-weight: 900;
          text-decoration: none;
          text-align: right;
        }

        .emc-intelligence-footer a:hover {
          color: white;
        }

        .emc-handoffs {
          display: grid;
          grid-template-columns:
            repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .emc-handoff {
          display: flex;
          min-width: 0;
          min-height: 150px;
          flex-direction: column;
          justify-content: space-between;
          gap: 14px;
          padding: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.52);
        }

        .emc-handoff-copy strong {
          display: block;
          margin-top: 6px;
          color: var(--vs-text, #f8fafc);
          font-size: 15px;
        }

        .emc-handoff-copy p {
          margin: 6px 0 0;
          color: var(--vs-text-muted, #94a3b8);
          font-size: 11px;
          line-height: 1.45;
        }

        .emc-handoff strong.emc-handoff-count {
          color: white;
          font-size: 24px;
        }

        .emc-handoff a {
          align-self: flex-start;
          color: #bfdbfe;
          font-size: 11px;
          font-weight: 900;
          text-decoration: none;
        }

        .emc-handoff a:hover {
          color: white;
        }

        .emc-source-note {
          margin: 14px 0 0;
          color: var(--vs-text-muted, #94a3b8);
          font-size: 11px;
          line-height: 1.55;
        }

        @media (max-width: 1180px) {
          .emc-handoffs {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .emc-intelligence-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .emc-layout,
          .emc-command {
            grid-template-columns: 1fr;
          }

          .emc-command-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 720px) {
          .emc-handoffs,
          .emc-intelligence-grid {
            grid-template-columns: 1fr;
          }

          .emc-exception {
            grid-template-columns: 1fr;
          }

          .emc-exception-action {
            align-items: flex-start;
            flex-direction: row;
          }

          .emc-intelligence-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .emc-intelligence-footer a {
            text-align: left;
          }
        }
      `}</style>

      {error ? (
        <div className="vs-banner vs-banner-danger">
          {error}

          <button
            className="vs-button vs-button-secondary"
            type="button"
            onClick={() => load()}
          >
            Try Again
          </button>
        </div>
      ) : null}

      {/* ====================================================================
          Executive operating posture
          ================================================================= */}

      <section
        className="emc-command"
        aria-labelledby="mission-command-title"
      >
        <div>
          <span>Next 24 Hours</span>

          <h2 id="mission-command-title">
            {lower(missionRisk) === "stable"
              ? "Operating posture is stable"
              : `${missionRisk} mission conditions require coordination`}
          </h2>

          <p>
            Mission Control ranks cross-system exceptions and
            intelligence for executive coordination. Execution
            ownership and completion remain authoritative in Command
            Center.
          </p>
        </div>

        <div className="emc-command-actions">
          <Link
            className="vs-button"
            to="/command-center"
          >
            Open Command Center
          </Link>

          <button
            className="vs-button vs-button-secondary"
            type="button"
            onClick={() => load({ quiet: true })}
            disabled={refreshing || loading}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </section>

      {/* ====================================================================
          Mission metrics
          ================================================================= */}

      <div className="emc-metrics vs-grid-4">
        <StatCard
          label="Mission Pressure"
          value={pct(pressureScore)}
          delta={missionRisk}
          tone={pressureScore >= 65 ? "down" : "up"}
        />

        <StatCard
          label="Ranked Interventions"
          value={fmt(missionItems.length)}
          delta="Next 24 hours"
          tone={missionItems.length ? "neutral" : "up"}
        />

        <StatCard
          label="At-Risk Workspaces"
          value={fmt(allAtRiskWorkspaces.length)}
          delta={`${workspaceHealth.length} monitored`}
          tone={
            allAtRiskWorkspaces.length
              ? "down"
              : "up"
          }
        />

        <StatCard
          label="Active Escalations"
          value={fmt(allActiveEscalations.length)}
          delta={`${exceptionCount} total exceptions`}
          tone={
            allActiveEscalations.length
              ? "down"
              : "up"
          }
        />
      </div>

      {/* ====================================================================
          Mission queue and operational exceptions
          ================================================================= */}

      {loading ? (
        <EmptyState text="Loading Mission Control..." />
      ) : (
        <div className="emc-layout">
          <SectionCard
            title="Next 24 Hours Mission Queue"
            subtitle="The six highest-ranked interventions requiring coordinated leadership attention."
            right={
              <Badge
                tone={
                  rankedMissionItems.length
                    ? "demo"
                    : "active"
                }
              >
                {rankedMissionItems.length} shown
              </Badge>
            }
          >
            <div className="emc-stack">
              {!rankedMissionItems.length ? (
                <EmptyState text="No urgent mission interventions are currently ranked." />
              ) : (
                rankedMissionItems.map(
                  (item, index) => (
                    <MissionQueueRow
                      key={
                        item.id ||
                        `${item.type || "mission"}-${index}`
                      }
                      item={item}
                      index={index}
                    />
                  )
                )
              )}
            </div>
          </SectionCard>

          <div className="emc-stack">
            <SectionCard
              title="Operational Exceptions"
              subtitle="Material conditions currently contributing to mission pressure."
              right={
                <Badge
                  tone={
                    exceptionCount
                      ? "danger"
                      : "active"
                  }
                >
                  {exceptionCount}
                </Badge>
              }
            >
              <div className="emc-stack">
                {riskDrivingSignals.map(
                  (signal, index) => (
                    <ExceptionRow
                      key={
                        signal.id ||
                        `signal-${index}`
                      }
                      label="Risk-Driving Signal"
                      title={signal.title}
                      description={
                        signal.summary ||
                        signal.source
                      }
                      value={clean(
                        signal.risk ||
                          signal.severity,
                        "Elevated"
                      )}
                      route="/political-signals"
                      badgeTone="danger"
                    />
                  )
                )}

                {atRiskWorkspaces.map(
                  (workspace, index) => (
                    <ExceptionRow
                      key={
                        workspace.id ||
                        `workspace-${index}`
                      }
                      label="At-Risk Workspace"
                      title={workspace.name}
                      description={`${
                        workspace.state ||
                        "National"
                      } | ${
                        workspace.office ||
                        "Campaign"
                      } | ${
                        workspace.cycle ||
                        "2026"
                      }`}
                      value={
                        workspace.risk ||
                        "Elevated"
                      }
                      route="/command-center"
                      badgeTone={tone(
                        workspace.risk
                      )}
                    />
                  )
                )}

                {activeEscalations.map(
                  (response, index) => (
                    <ExceptionRow
                      key={
                        response.id ||
                        `response-${index}`
                      }
                      label="Rapid-Response Escalation"
                      title={response.title}
                      description={
                        response.response_strategy ||
                        response.narrative_summary
                      }
                      value={clean(
                        response.threat_level ||
                          response.status,
                        "Open"
                      )}
                      route="/narrative-response"
                      badgeTone={tone(
                        response.threat_level ||
                          response.status
                      )}
                    />
                  )
                )}

                {criticalVendorGaps.map(
                  (vendor, index) => (
                    <ExceptionRow
                      key={
                        vendor.id ||
                        `vendor-${index}`
                      }
                      label="Vendor Capacity Gap"
                      title={
                        vendor.name ||
                        vendor.vendor_name
                      }
                      description={
                        vendor.category ||
                        vendor.notes
                      }
                      value={clean(
                        vendor.risk ||
                          vendor.coverage_tier,
                        "Gap"
                      )}
                      route="/vendors"
                      badgeTone="demo"
                    />
                  )
                )}

                {!exceptionCount ? (
                  <EmptyState text="No material operational exceptions are active." />
                ) : null}

                {exceptionCount >
                displayedExceptionCount ? (
                  <p className="emc-source-note">
                    Showing the highest-pressure
                    exceptions. {exceptionCount} total
                    exceptions are currently represented
                    across connected operating systems.
                  </p>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ====================================================================
          Executive Intelligence
          ================================================================= */}

      {!loading ? (
        <div className="emc-intelligence-section">
          <SectionCard
            title="Executive Intelligence"
            subtitle="Highest-ranked AI-supported recommendations derived from the current operating picture."
            right={
              <Badge
                tone={
                  recommendationCount
                    ? "accent"
                    : "active"
                }
              >
                {fmt(recommendationCount)}
              </Badge>
            }
          >
            {!rankedAiRecommendations.length ? (
              <EmptyState text="No executive intelligence recommendations are currently available." />
            ) : (
              <div className="emc-intelligence-grid">
                {rankedAiRecommendations.map(
                  (item, index) => (
                    <IntelligenceRecommendationRow
                      key={
                        item.id ||
                        item.recommendation_id ||
                        `ai-recommendation-${index}`
                      }
                      item={item}
                      index={index}
                    />
                  )
                )}
              </div>
            )}

            {aiRecommendations.length >
            rankedAiRecommendations.length ? (
              <p className="emc-source-note">
                Showing the{" "}
                {rankedAiRecommendations.length}{" "}
                highest-ranked recommendations from{" "}
                {aiRecommendations.length} currently
                available intelligence recommendations.
              </p>
            ) : null}
          </SectionCard>
        </div>
      ) : null}

      {/* ====================================================================
          Authoritative systems
          ================================================================= */}

      <SectionCard
        title="Authoritative Operating Systems"
        subtitle="Mission Control summarizes operating pressure and executive intelligence; detailed investigation and execution remain in the connected system of record."
      >
        <div className="emc-handoffs">
          {handoffs.map((item) => (
            <article
              className="emc-handoff"
              key={item.label}
            >
              <div className="emc-handoff-copy">
                <span>{item.label}</span>

                <strong className="emc-handoff-count">
                  {fmt(item.count)}
                </strong>

                <p>
                  {item.countLabel} |{" "}
                  {item.detail}
                </p>
              </div>

              <Link to={item.route}>
                Open authoritative page
              </Link>
            </article>
          ))}
        </div>

        <p className="emc-source-note">
          Political Signals owns signal evidence.
          Command Center owns tasks, execution and
          completion. Campaign CRM owns stakeholder
          follow-ups. Vendor Network owns capacity
          records. Rapid Response owns narrative-response
          workflows. Mission Control owns executive
          prioritization across those systems.
        </p>
      </SectionCard>
    </PageShell>
  );
}
