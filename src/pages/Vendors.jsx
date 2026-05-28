import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function fmtMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function normalizeList(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return data?.results || data?.vendors || data?.rows || [];
}

function severityTone(value) {
  const v = String(value || "").toLowerCase();

  if (v === "high" || v === "critical" || v === "elevated") return "danger";
  if (v === "medium" || v === "watch") return "demo";

  return "accent";
}

function performanceTone(score) {
  const next = Number(score || 0);

  if (next >= 85) return "accent";
  if (next >= 70) return "demo";

  return "danger";
}

function performanceLabel(score) {
  const next = Number(score || 0);

  if (next >= 85) return "Strong";
  if (next >= 70) return "Watch";

  return "Risk";
}

function getActionKey(action = {}, fallback = "") {
  return String(
    action.id ||
      `${action.state || "National"}-${action.title || fallback || "vendor-action"}`
  );
}

function getInitialUrlParams() {
  if (typeof window === "undefined") return { state: "", source: "" };

  const params = new URLSearchParams(window.location.search);

  return {
    state: params.get("state") || "",
    source: params.get("source") || "",
  };
}

function updateUrlState(state) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  if (state) url.searchParams.set("state", state);
  else url.searchParams.delete("state");

  if (!url.searchParams.get("source")) {
    url.searchParams.set("source", "vendor-network");
  }

  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

function statesMatch(a, b) {
  const left = String(a || "").trim().toLowerCase();
  const right = String(b || "").trim().toLowerCase();

  return Boolean(left && right && left === right);
}

function goToCommandCenter() {
  window.location.href = "/command-center";
}

function VendorRow({ vendor, highlighted = false }) {
  const name = vendor.name || vendor.vendor_name || "Unnamed Vendor";
  const category = vendor.category || "Campaign Vendor";
  const state = vendor.state || vendor.primary_state || "Unknown";
  const services =
    vendor.services ||
    vendor.capabilities ||
    vendor.description ||
    "Campaign operations and political services";

  return (
    <div
      className={`vs-premium-row-card ${
        highlighted ? "is-highlighted-vendor" : ""
      }`}
    >
      <ResponsiveRow
        title={name}
        subtitle={`${state} • ${category}`}
        meta={[
          { label: "Coverage", value: vendor.coverage_area || state || "—" },
          { label: "Contract", value: fmtMoney(vendor.contract_value) },
          { label: "Services", value: services },
        ]}
        right={
          <div className="vs-inline-actions">
            {highlighted ? <Badge tone="demo">Task Match</Badge> : null}
            <Badge tone="accent">{vendor.status || "active"}</Badge>
          </div>
        }
      />
    </div>
  );
}

function RiskRow({ item }) {
  const severity = item.severity || item.priority || "Medium";

  return (
    <div
      className={`vs-premium-row-card ${
        severity === "High" ? "is-elevated" : ""
      }`}
    >
      <ResponsiveRow
        title={item.title || "Vendor intelligence signal"}
        subtitle={
          item.detail || "Review vendor coverage and operational readiness."
        }
        meta={[
          { label: "Severity", value: severity },
          { label: "State", value: item.state || "National" },
        ]}
        right={<Badge tone={severityTone(severity)}>{severity}</Badge>}
      />
    </div>
  );
}

function PerformanceRow({ item }) {
  const score = Number(item.overall_score || 0);
  const onTime = Number(item.on_time_score || 0);
  const reliability = Number(item.reliability_score || 0);
  const risk = Number(item.risk_score || 0);
  const delayedJobs = Number(item.delayed_jobs || 0);
  const totalJobs = Number(item.total_jobs || 0);

  return (
    <div className={`vs-premium-row-card ${score < 70 ? "is-elevated" : ""}`}>
      <ResponsiveRow
        title={item.vendor_name || "Unnamed Vendor"}
        subtitle={`${item.state || "National"} • ${totalJobs} MailOps job${
          totalJobs === 1 ? "" : "s"
        }`}
        meta={[
          { label: "Overall", value: `${score}%` },
          { label: "On-Time", value: `${onTime}%` },
          { label: "Reliability", value: `${reliability}%` },
          { label: "Risk", value: `${risk}%` },
          { label: "Delayed", value: delayedJobs },
        ]}
        right={
          <Badge tone={performanceTone(score)}>{performanceLabel(score)}</Badge>
        }
      />
    </div>
  );
}

function ResolvedGapRow({ item }) {
  return (
    <div className="vs-premium-row-card is-resolved-gap">
      <ResponsiveRow
        title={item.title || `${item.state || "State"} vendor gap resolved`}
        subtitle={
          item.detail ||
          "This vendor coverage gap has been resolved by a completed task."
        }
        meta={[
          { label: "State", value: item.state || "National" },
          { label: "Score", value: item.coverage_score ?? "—" },
          { label: "Status", value: "Resolved" },
        ]}
        right={<Badge tone="active">Resolved by Task</Badge>}
      />
    </div>
  );
}

function ActionTaskRow({ action, onCreateTask, creating, taskExists }) {
  const severity = action.priority || action.severity || "Medium";

  return (
    <div
      className={`vs-premium-row-card ${
        severity === "High" ? "is-elevated" : "is-action"
      }`}
    >
      <ResponsiveRow
        title={action.title || "Review vendor coverage"}
        subtitle={action.detail || "Generated by vendor scoring."}
        meta={[
          { label: "Owner", value: action.owner || "Operations" },
          { label: "Due", value: action.due || "This Week" },
          { label: "State", value: action.state || "National" },
        ]}
        right={
          taskExists ? (
            <Badge tone="demo">Task Exists</Badge>
          ) : (
            <button
              type="button"
              className="vs-decision-btn deploy"
              disabled={creating}
              onClick={() => onCreateTask(action)}
            >
              {creating ? "Creating..." : "Create Task"}
            </button>
          )
        }
      />
    </div>
  );
}

export default function Vendors() {
  const initialUrl = getInitialUrlParams();
  const vendorDirectoryRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [intel, setIntel] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [performanceSummary, setPerformanceSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [error, setError] = useState("");
  const [dispatchMessage, setDispatchMessage] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [resolutionMessage, setResolutionMessage] = useState("");
  const [creatingTaskId, setCreatingTaskId] = useState("");
  const [existingTaskIds, setExistingTaskIds] = useState(() => new Set());

  const [sourceContext] = useState(initialUrl.source);

  const [filters, setFilters] = useState({
    q: "",
    state: initialUrl.state,
    category: "",
    status: "",
    page: 1,
    limit: 12,
  });

  const isFromExecutionBoard = sourceContext === "execution-board";
  const highlightedState = isFromExecutionBoard ? filters.state : "";

  useEffect(() => {
    updateUrlState(filters.state);
  }, [filters.state]);

  useEffect(() => {
    let active = true;

    async function loadFilters() {
      try {
        const [stateData, categoryData, statusData] = await Promise.all([
          api.vendorStates?.(),
          api.vendorCategories?.(),
          api.vendorStatuses?.(),
        ]);

        if (!active) return;

        setStates(normalizeList(stateData, ["states", "results"]));
        setCategories(normalizeList(categoryData, ["categories", "results"]));
        setStatuses(normalizeList(statusData, ["statuses", "results"]));
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load vendor filters");
      }
    }

    loadFilters();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadVendors() {
      try {
        setLoading(true);
        setError("");

        const data = await api.vendors(filters);

        if (!active) return;

        setRows(normalizeList(data, ["results", "vendors", "rows"]));
      } catch (err) {
        if (!active) return;

        setError(err?.message || "Failed to load vendors");
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVendors();

    return () => {
      active = false;
    };
  }, [filters]);

  async function loadIntel() {
    setIntelLoading(true);

    try {
      const data = await api.vendorScoring?.();

      setIntel(data || null);

      const resolvedCount = data?.resolved_gaps?.length || 0;

      if (resolvedCount) {
        setResolutionMessage(
          `${resolvedCount} vendor gap${
            resolvedCount === 1 ? "" : "s"
          } resolved by completed task.`
        );
      } else {
        setResolutionMessage("");
      }
    } catch {
      setIntel(null);
      setResolutionMessage("");
    } finally {
      setIntelLoading(false);
    }
  }

  useEffect(() => {
    loadIntel();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPerformance() {
      try {
        setPerformanceLoading(true);

        const data = await api.vendorPerformance?.({
          state: filters.state,
          limit: 25,
        });

        if (!active) return;

        setPerformance(data?.results || []);
        setPerformanceSummary(data?.summary || null);
      } catch {
        if (!active) return;

        setPerformance([]);
        setPerformanceSummary(null);
      } finally {
        if (active) setPerformanceLoading(false);
      }
    }

    loadPerformance();

    return () => {
      active = false;
    };
  }, [filters.state]);

  useEffect(() => {
    if (!isFromExecutionBoard || loading || !rows.length) return;

    const timer = setTimeout(() => {
      vendorDirectoryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [isFromExecutionBoard, loading, rows.length]);

  async function dispatchVendorAlerts() {
    try {
      setDispatchMessage("Dispatching vendor alerts...");

      const result = await api.dispatchVendorAlerts?.();

      setDispatchMessage(
        `Dispatched ${result?.dispatched || 0} vendor intelligence alerts.`
      );
    } catch (err) {
      setDispatchMessage(err?.message || "Failed to dispatch vendor alerts.");
    }
  }

  async function createVendorTask(action = {}) {
    const taskKey = getActionKey(action);

    try {
      setCreatingTaskId(taskKey);
      setTaskMessage(
        `Creating task: ${action.title || "Review vendor coverage"}`
      );

      const result = await api.createTask?.({
        title: action.title || "Review vendor coverage",
        description:
          action.detail || "Generated from Vendor Network intelligence.",
        source: "vendor_network",
        state: action.state || "National",
        office: "Statewide",
        priority: action.priority === "High" ? "high" : "medium",
        status: "open",
        assigned_to: action.owner || "Operations",
        due_label: action.priority === "High" ? "Today" : action.due || "This Week",
        metadata: {
          vendor_action_id: taskKey,
          vendor_action: action,
        },
      });

      setExistingTaskIds((prev) => {
        const next = new Set(prev);
        next.add(taskKey);
        return next;
      });

      if (result?.duplicate) {
        setTaskMessage(`Task exists: ${action.title || "Review vendor coverage"}`);
        return;
      }

      setTaskMessage(`Task created: ${action.title || "Review vendor coverage"}`);
    } catch (err) {
      setTaskMessage(err?.message || "Failed to create vendor task.");
    } finally {
      setCreatingTaskId("");
    }
  }

  const summary = useMemo(() => {
    return (
      intel?.summary || {
        total_vendors: rows.length,
        active_vendors: rows.filter(
          (row) => String(row.status || "").toLowerCase() === "active"
        ).length,
        states_covered: new Set(rows.map((row) => row.state).filter(Boolean)).size,
        categories_covered: new Set(
          rows.map((row) => row.category).filter(Boolean)
        ).size,
        high_gap_states: 0,
        medium_gap_states: 0,
        resolved_gap_states: 0,
      }
    );
  }, [intel, rows]);

  const gapCount =
    Number(summary.high_gap_states || 0) + Number(summary.medium_gap_states || 0);

  const resolvedGapCount = Number(
    summary.resolved_gap_states || intel?.resolved_gaps?.length || 0
  );

  const strongPerformanceCount = Number(performanceSummary?.strong_vendors || 0);
  const riskPerformanceCount = Number(performanceSummary?.risk_vendors || 0);

  const highlightedRowsCount = useMemo(() => {
    if (!highlightedState) return 0;

    return rows.filter((row) =>
      statesMatch(row.state || row.primary_state, highlightedState)
    ).length;
  }, [rows, highlightedState]);

  return (
    <PageShell
      eyebrow="Vendor Intelligence"
      title="Vendor Network"
      description="Live campaign vendor coverage, performance scoring, operational readiness, and execution tasking."
      tickerItems={[
        {
          label: "Vendors",
          value: `${summary.total_vendors || 0} live`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Coverage",
          value: `${summary.states_covered || 0} states`,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "Gaps",
          value: `${gapCount} active`,
          dotClass: gapCount ? "vs-live-dot" : "vs-live-dot-success",
        },
        {
          label: "Performance",
          value: `${strongPerformanceCount} strong / ${riskPerformanceCount} risk`,
          dotClass: riskPerformanceCount ? "vs-live-dot" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .vs-premium-row-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.48));
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.18);
          overflow: hidden;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, opacity 220ms ease;
          animation: vsGapIn 260ms ease both;
        }

        .vs-premium-row-card:hover {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.32);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.24);
        }

        .vs-premium-row-card.is-elevated {
          border-color: rgba(248, 113, 113, 0.32);
          background: linear-gradient(135deg, rgba(127, 29, 29, 0.22), rgba(15, 23, 42, 0.68));
        }

        .vs-premium-row-card.is-action {
          border-color: rgba(34, 197, 94, 0.18);
        }

        .vs-premium-row-card.is-highlighted-vendor {
          border-color: rgba(34, 197, 94, 0.55);
          background: linear-gradient(135deg, rgba(22, 101, 52, 0.26), rgba(15, 23, 42, 0.72));
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.28), 0 18px 46px rgba(22, 163, 74, 0.14);
        }

        .vs-premium-row-card.is-resolved-gap {
          border-color: rgba(34, 197, 94, 0.42);
          background: linear-gradient(135deg, rgba(20, 83, 45, 0.28), rgba(15, 23, 42, 0.62));
          animation: vsResolvedPulse 680ms ease both;
        }

        .vs-premium-row-card .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .vs-execution-filter-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .vs-execution-filter-banner-copy {
          min-width: 220px;
          flex: 1;
        }

        @keyframes vsGapIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes vsResolvedPulse {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.0);
          }
          45% {
            opacity: 1;
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.22), 0 18px 46px rgba(22, 163, 74, 0.10);
          }
        }
      `}</style>

      {isFromExecutionBoard ? (
        <div className="vs-banner vs-live-banner-pulse vs-execution-filter-banner">
          <div className="vs-execution-filter-banner-copy">
            Filtered from Execution Board — highlighting vendor coverage connected
            to this task{filters.state ? ` in ${filters.state}` : ""}.
            {highlightedRowsCount
              ? ` ${highlightedRowsCount} matching vendor${
                  highlightedRowsCount === 1 ? "" : "s"
                } highlighted.`
              : ""}
          </div>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={goToCommandCenter}
          >
            Back to Command Center
          </button>
        </div>
      ) : null}

      {resolutionMessage ? (
        <div className="vs-banner vs-live-banner-pulse">
          {resolutionMessage}
        </div>
      ) : null}

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      {dispatchMessage ? <div className="vs-banner">{dispatchMessage}</div> : null}

      {taskMessage ? (
        <div className="vs-banner vs-live-banner-pulse">{taskMessage}</div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard
          label="Total Vendors"
          value={summary.total_vendors || 0}
          delta="Live vendor records"
          tone="up"
        />
        <StatCard
          label="Active Vendors"
          value={summary.active_vendors || 0}
          delta="Ready capacity"
          tone="up"
        />
        <StatCard
          label="Active Gaps"
          value={gapCount}
          delta="Open coverage pressure"
          tone={gapCount ? "down" : "up"}
        />
        <StatCard
          label="Risk Vendors"
          value={riskPerformanceCount}
          delta="MailOps-linked performance risk"
          tone={riskPerformanceCount ? "down" : "up"}
        />
      </div>

      <SectionCard
        title="Vendor Controls"
        subtitle="Filter the live vendor network and dispatch vendor intelligence alerts."
        right={
          <button
            type="button"
            className="vs-decision-btn deploy"
            onClick={dispatchVendorAlerts}
          >
            Dispatch Vendor Alerts
          </button>
        }
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            placeholder="Search vendors"
            value={filters.q}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                q: e.target.value,
                page: 1,
              }))
            }
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                state: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All states</option>
            {states.map((item, index) => {
              const value = item.name || item.state || item;

              return (
                <option key={`${value}-${index}`} value={value}>
                  {value}
                </option>
              );
            })}
          </select>

          <select
            className="vs-input"
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                category: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All categories</option>
            {categories.map((item, index) => {
              const value = item.name || item.category || item;

              return (
                <option key={`${value}-${index}`} value={value}>
                  {value}
                </option>
              );
            })}
          </select>

          <select
            className="vs-input"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All statuses</option>
            {statuses.map((item, index) => {
              const value = item.name || item.status || item;

              return (
                <option key={`${value}-${index}`} value={value}>
                  {value}
                </option>
              );
            })}
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title="Top Vendor Performance"
        subtitle="MailOps-linked vendor reliability, delivery risk, and operational execution scoring."
        right={<Badge tone="accent">{performance.length} scored</Badge>}
      >
        <div className="vs-stack">
          {performanceLoading ? (
            <EmptyState text="Loading vendor performance..." />
          ) : !performance.length ? (
            <EmptyState text="No vendor performance history yet." />
          ) : (
            performance.slice(0, 8).map((item) => (
              <PerformanceRow
                key={item.id || item.vendor_id || item.vendor_name}
                item={item}
              />
            ))
          )}
        </div>
      </SectionCard>

      <div className="vs-grid-2">
        <div ref={vendorDirectoryRef}>
          <SectionCard
            title="Live Vendor Directory"
            subtitle={
              filters.state
                ? `Database-backed vendor network filtered to ${filters.state}.`
                : "Database-backed vendor network with operating coverage and status."
            }
            right={<Badge tone="accent">{rows.length} shown</Badge>}
          >
            <div className="vs-stack">
              {loading ? (
                <EmptyState text="Loading vendors..." />
              ) : rows.length === 0 ? (
                <EmptyState text="No vendors found." />
              ) : (
                rows.map((vendor, index) => {
                  const highlighted =
                    isFromExecutionBoard &&
                    filters.state &&
                    statesMatch(vendor.state || vendor.primary_state, filters.state);

                  return (
                    <VendorRow
                      key={
                        vendor.id ??
                        vendor.vendor_id ??
                        `${vendor.name || vendor.vendor_name}-${index}`
                      }
                      vendor={vendor}
                      highlighted={highlighted}
                    />
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

        <div className="vs-stack">
          <SectionCard
            title="Active Coverage Gaps"
            subtitle="Open vendor coverage gaps that still require operational action."
            right={
              <Badge tone={gapCount ? "danger" : "accent"}>
                {gapCount} active
              </Badge>
            }
          >
            <div className="vs-stack">
              {intelLoading ? (
                <EmptyState text="Loading vendor intelligence..." />
              ) : !intel?.gaps?.length ? (
                <EmptyState text="No active vendor coverage gaps." />
              ) : (
                intel.gaps
                  .slice(0, 6)
                  .map((gap, index) => (
                    <RiskRow key={`${gap.state}-${index}`} item={gap} />
                  ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Resolved Gap History"
            subtitle="Vendor coverage gaps closed through completed execution tasks."
            right={<Badge tone="active">{resolvedGapCount} resolved</Badge>}
          >
            <div className="vs-stack">
              {intelLoading ? (
                <EmptyState text="Loading resolved vendor history..." />
              ) : !intel?.resolved_gaps?.length ? (
                <EmptyState text="No resolved vendor gaps yet." />
              ) : (
                intel.resolved_gaps
                  .slice(0, 6)
                  .map((gap, index) => (
                    <ResolvedGapRow key={`${gap.state}-${index}`} item={gap} />
                  ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Recommended Actions"
            subtitle="Create execution tasks directly from active vendor intelligence."
            right={
              <Badge tone="demo">
                {intel?.recommended_actions?.length || 0} actions
              </Badge>
            }
          >
            <div className="vs-stack">
              {!intel?.recommended_actions?.length ? (
                <EmptyState text="No recommended vendor actions." />
              ) : (
                intel.recommended_actions.slice(0, 6).map((action, index) => {
                  const taskKey = getActionKey(action, index);

                  return (
                    <ActionTaskRow
                      key={taskKey}
                      action={action}
                      creating={creatingTaskId === taskKey}
                      taskExists={existingTaskIds.has(taskKey)}
                      onCreateTask={createVendorTask}
                    />
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}

