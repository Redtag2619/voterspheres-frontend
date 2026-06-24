import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const VENDOR_GROUPS = [
  "Mail",
  "Digital",
  "Media",
  "Compliance",
  "Consulting",
  "Events",
];

function fmtMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function fmtMoneyShort(value) {
  const amount = Number(value || 0);
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return fmtMoney(amount);
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

function sourceLabel(value) {
  if (value === "fec_schedule_b") return "FEC Schedule B";
  return value || "Database";
}

function normalizeVendorGroup(category = "", services = "") {
  const value = `${category} ${services}`.toLowerCase();

  if (
    value.includes("mail") ||
    value.includes("print") ||
    value.includes("postage") ||
    value.includes("postcard") ||
    value.includes("letter") ||
    value.includes("mailer")
  ) {
    return "Mail";
  }

  if (
    value.includes("digital") ||
    value.includes("data") ||
    value.includes("software") ||
    value.includes("text") ||
    value.includes("sms") ||
    value.includes("email") ||
    value.includes("crm") ||
    value.includes("website")
  ) {
    return "Digital";
  }

  if (
    value.includes("media") ||
    value.includes("advertising") ||
    value.includes("tv") ||
    value.includes("radio") ||
    value.includes("broadcast") ||
    value.includes("ad buy") ||
    value.includes("placement")
  ) {
    return "Media";
  }

  if (
    value.includes("compliance") ||
    value.includes("legal") ||
    value.includes("treasurer") ||
    value.includes("accounting") ||
    value.includes("finance")
  ) {
    return "Compliance";
  }

  if (
    value.includes("consult") ||
    value.includes("strategy") ||
    value.includes("poll") ||
    value.includes("survey") ||
    value.includes("research") ||
    value.includes("field") ||
    value.includes("canvass")
  ) {
    return "Consulting";
  }

  if (
    value.includes("event") ||
    value.includes("venue") ||
    value.includes("travel") ||
    value.includes("lodging") ||
    value.includes("hotel") ||
    value.includes("catering")
  ) {
    return "Events";
  }

  return "Consulting";
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

function goToCommandCenter(params = {}) {
  const query = new URLSearchParams();

  if (params.vendor) query.set("vendor", params.vendor);
  if (params.state) query.set("state", params.state);
  query.set("source", params.source || "vendor-network");

  const queryString = query.toString();
  window.location.href = queryString ? `/command-center?${queryString}` : "/command-center";
}

async function loadFecVendorSpend(params = {}) {
  if (typeof api.vendorFecSpend === "function") {
    return api.vendorFecSpend(params);
  }

  if (typeof api.get === "function") {
    const response = await api.get("/vendor-fec/spend", {
      params,
      timeout: 10000,
    });

    return response?.data || response;
  }

  return null;
}

function mergeByVendorName(primaryRows = [], fecRows = []) {
  const map = new Map();

  primaryRows.forEach((row) => {
    const key = String(row.name || row.vendor_name || "").toLowerCase();
    if (key) map.set(key, row);
  });

  fecRows.forEach((row) => {
    const key = String(row.name || row.vendor_name || "").toLowerCase();
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, row);
      return;
    }

    const existing = map.get(key);
    map.set(key, {
      ...row,
      ...existing,
      fec_contract_value: row.contract_value,
      fec_transaction_count: row.transaction_count,
      committee_clients: existing.committee_clients || row.committee_clients,
      source: existing.source || row.source,
    });
  });

  return [...map.values()];
}

function VendorRow({ vendor, highlighted = false, onCreateCommandTask }) {
  const name = vendor.name || vendor.vendor_name || "Unnamed Vendor";
  const category = vendor.category || "Campaign Vendor";
  const state = vendor.state || vendor.primary_state || "Unknown";
  const services =
    vendor.services ||
    vendor.capabilities ||
    vendor.description ||
    "Campaign operations and political services";
  const group = normalizeVendorGroup(category, services);

  return (
    <div
      className={`vs-premium-row-card ${
        highlighted ? "is-highlighted-vendor" : ""
      }`}
    >
      <ResponsiveRow
        title={name}
        subtitle={`${state} | ${group} | ${category} | ${sourceLabel(vendor.source)}`}
        meta={[
          { label: "Coverage", value: vendor.coverage_area || state || "—" },
          { label: "Spend / Contract", value: fmtMoney(vendor.contract_value || vendor.fec_contract_value) },
          { label: "Transactions", value: vendor.transaction_count || vendor.fec_transaction_count || "—" },
          { label: "Services", value: services },
        ]}
        right={
          <div className="vs-inline-actions">
            {highlighted ? <Badge tone="demo">Task Match</Badge> : null}
            <Badge tone="info">{group}</Badge>
            <Badge tone="accent">{vendor.status || "active"}</Badge>
          </div>
        }
      />

      <div className="vs-vendor-source-strip">
        {vendor.committee_clients ? (
          <span>
            Committee clients: {String(vendor.committee_clients).split(",").slice(0, 4).join(", ")}
          </span>
        ) : (
          <span>Committee clients unavailable from current record.</span>
        )}

        <div className="vs-vendor-row-actions">
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() =>
              goToCommandCenter({
                vendor: name,
                state,
              })
            }
          >
            Open in Command Center
          </button>

          <button
            type="button"
            className="vs-button"
            onClick={() => onCreateCommandTask?.({
              title: `Review ${name}`,
              detail: services,
              state,
              owner: "Operations",
              priority: "Medium",
              vendor_name: name,
            })}
          >
            Create Command Task
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorGroupCard({ group, vendors = [], onOpenGroup }) {
  const total = vendors.reduce(
    (sum, vendor) => sum + Number(vendor.contract_value || vendor.fec_contract_value || 0),
    0
  );

  const stateCount = new Set(
    vendors.map((vendor) => vendor.state || vendor.primary_state).filter(Boolean)
  ).size;

  const committeeCount = vendors.reduce(
    (sum, vendor) => sum + Number(vendor.committee_count || 0),
    0
  );

  return (
    <button
      type="button"
      className="vs-vendor-group-card"
      onClick={() => onOpenGroup(group)}
    >
      <div>
        <div className="vs-vendor-group-title">{group}</div>
        <div className="vs-vendor-group-subtitle">
          {vendors.length} vendors | {stateCount} states
        </div>
      </div>

      <div className="vs-vendor-group-money">{fmtMoneyShort(total)}</div>

      <div className="vs-vendor-group-meta">
        <Badge tone={vendors.length ? "active" : "default"}>
          {vendors.length ? "Active" : "No Records"}
        </Badge>
        <Badge tone="info">{committeeCount} committee links</Badge>
      </div>
    </button>
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
  const totalJobs = Number(item.total_jobs || item.transaction_count || 0);

  return (
    <div className={`vs-premium-row-card ${score < 70 ? "is-elevated" : ""}`}>
      <ResponsiveRow
        title={item.vendor_name || item.name || "Unnamed Vendor"}
        subtitle={`${item.state || "National"} | ${totalJobs} FEC spend record${
          totalJobs === 1 ? "" : "s"
        }`}
        meta={[
          { label: "Overall", value: `${score}%` },
          { label: "On-Time", value: `${onTime}%` },
          { label: "Reliability", value: `${reliability}%` },
          { label: "Risk", value: `${risk}%` },
          { label: "Spend", value: fmtMoneyShort(item.contract_value || 0) },
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

function SpendCategoryRow({ item }) {
  return (
    <div className="vs-premium-row-card">
      <ResponsiveRow
        title={item.category || "Campaign Operations"}
        subtitle={`${item.vendor_count || 0} vendors | ${item.transaction_count || 0} transactions`}
        meta={[
          { label: "Total Spend", value: fmtMoney(item.total_amount || 0) },
          { label: "Source", value: "FEC Schedule B" },
        ]}
        right={<Badge tone="info">{fmtMoneyShort(item.total_amount || 0)}</Badge>}
      />
    </div>
  );
}

export default function Vendors() {
  const initialUrl = getInitialUrlParams();
  const vendorDirectoryRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [fecRows, setFecRows] = useState([]);
  const [fecCategories, setFecCategories] = useState([]);
  const [fecStates, setFecStates] = useState([]);
  const [fecLoading, setFecLoading] = useState(true);
  const [fecError, setFecError] = useState("");

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
    cycle: "2026",
  });

  const [selectedGroup, setSelectedGroup] = useState("");

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

  useEffect(() => {
    let active = true;

    async function loadFec() {
      try {
        setFecLoading(true);
        setFecError("");

        const data = await loadFecVendorSpend({
          q: filters.q || undefined,
          state: filters.state || undefined,
          category: filters.category || undefined,
          cycle: filters.cycle || "2026",
          limit: 100,
          live: 1,
        });

        if (!active) return;

        setFecRows(normalizeList(data, ["results", "vendors", "rows"]));
        setFecCategories(normalizeList(data?.categories, ["categories", "results"]));
        setFecStates(normalizeList(data?.states, ["states", "results"]));

        if (data?.intel) {
          setIntel((current) => current || data.intel);
        }

        if (data?.performance?.length) {
          setPerformance((current) => current.length ? current : data.performance);
          setPerformanceSummary((current) => current || data.performanceSummary || null);
        }
      } catch (err) {
        if (!active) return;

        setFecError(err?.response?.data?.error || err?.message || "FEC vendor spend unavailable.");
        setFecRows([]);
        setFecCategories([]);
        setFecStates([]);
      } finally {
        if (active) setFecLoading(false);
      }
    }

    loadFec();

    return () => {
      active = false;
    };
  }, [filters.q, filters.state, filters.category, filters.cycle]);

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

        const apiPerformance = data?.results || [];
        setPerformance(apiPerformance.length ? apiPerformance : []);
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

  const displayRows = useMemo(() => {
    return mergeByVendorName(rows, fecRows);
  }, [rows, fecRows]);

  const groupedVendors = useMemo(() => {
    const grouped = {};

    VENDOR_GROUPS.forEach((group) => {
      grouped[group] = [];
    });

    displayRows.forEach((vendor) => {
      const group = normalizeVendorGroup(vendor.category, vendor.services || vendor.description);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(vendor);
    });

    return grouped;
  }, [displayRows]);

  const visibleRows = useMemo(() => {
    if (!selectedGroup) return displayRows;

    return displayRows.filter(
      (vendor) =>
        normalizeVendorGroup(vendor.category, vendor.services || vendor.description) === selectedGroup
    );
  }, [displayRows, selectedGroup]);

  useEffect(() => {
    if (!isFromExecutionBoard || loading || !displayRows.length) return;

    const timer = setTimeout(() => {
      vendorDirectoryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [isFromExecutionBoard, loading, displayRows.length]);

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

  const fallbackIntel = useMemo(() => {
    const activeStates = fecStates.filter((row) => Number(row.vendor_count || 0) < 3);
    const gaps = activeStates.slice(0, 8).map((row) => ({
      title: `${row.state || "State"} vendor coverage requires review`,
      detail: `${row.vendor_count || 0} FEC-derived vendors and ${row.transaction_count || 0} spending records are visible.`,
      state: row.state || "National",
      severity: Number(row.vendor_count || 0) < 2 ? "High" : "Medium",
      coverage_score: Math.min(100, Number(row.vendor_count || 0) * 20),
    }));

    return {
      summary: {
        total_vendors: displayRows.length,
        active_vendors: displayRows.filter((row) => String(row.status || "").toLowerCase() === "active").length,
        states_covered: new Set(displayRows.map((row) => row.state).filter(Boolean)).size,
        categories_covered: new Set(displayRows.map((row) => row.category).filter(Boolean)).size,
        high_gap_states: gaps.filter((row) => row.severity === "High").length,
        medium_gap_states: gaps.filter((row) => row.severity !== "High").length,
        resolved_gap_states: 0,
      },
      gaps,
      resolved_gaps: [],
      recommended_actions: gaps.slice(0, 6).map((gap) => ({
        title: `Expand vendor coverage in ${gap.state}`,
        detail: gap.detail,
        state: gap.state,
        priority: gap.severity === "High" ? "High" : "Medium",
        owner: "Operations",
        due: gap.severity === "High" ? "Today" : "This Week",
      })),
    };
  }, [displayRows, fecStates]);

  const effectiveIntel = intel || fallbackIntel;

  const summary = useMemo(() => {
    return (
      effectiveIntel?.summary || {
        total_vendors: displayRows.length,
        active_vendors: displayRows.filter(
          (row) => String(row.status || "").toLowerCase() === "active"
        ).length,
        states_covered: new Set(displayRows.map((row) => row.state).filter(Boolean)).size,
        categories_covered: new Set(
          displayRows.map((row) => row.category).filter(Boolean)
        ).size,
        high_gap_states: 0,
        medium_gap_states: 0,
        resolved_gap_states: 0,
      }
    );
  }, [effectiveIntel, displayRows]);

  const gapCount =
    Number(summary.high_gap_states || 0) + Number(summary.medium_gap_states || 0);

  const resolvedGapCount = Number(
    summary.resolved_gap_states || effectiveIntel?.resolved_gaps?.length || 0
  );

  const effectivePerformance = performance.length ? performance : fecRows;
  const strongPerformanceCount = Number(
    performanceSummary?.strong_vendors ||
      effectivePerformance.filter((row) => Number(row.overall_score || 0) >= 85).length
  );
  const riskPerformanceCount = Number(
    performanceSummary?.risk_vendors ||
      effectivePerformance.filter((row) => Number(row.overall_score || 0) < 70).length
  );

  const highlightedRowsCount = useMemo(() => {
    if (!highlightedState) return 0;

    return displayRows.filter((row) =>
      statesMatch(row.state || row.primary_state, highlightedState)
    ).length;
  }, [displayRows, highlightedState]);

  const mergedStates = useMemo(() => {
  const values = new Set();

  function addState(item) {
    if (!item) return;

    if (typeof item === "string") {
      values.add(item);
      return;
    }

    const value =
      item.state ||
      item.name ||
      item.primary_state ||
      item.payee_state ||
      item.abbr ||
      "";

    if (value) values.add(String(value));
  }

  states.forEach(addState);
  fecStates.forEach(addState);

  return [...values].filter(Boolean).sort();
}, [states, fecStates]);

  const mergedCategories = useMemo(() => {
  const values = new Set();

  function addCategory(item) {
    if (!item) return;

    if (typeof item === "string") {
      values.add(item);
      return;
    }

    const value =
      item.category ||
      item.name ||
      item.service ||
      item.vendor_group ||
      "";

    if (value) values.add(String(value));
  }

  categories.forEach(addCategory);
  fecCategories.forEach(addCategory);

  return [...values].filter(Boolean).sort();
}, [categories, fecCategories]);

  return (
    <PageShell
      eyebrow="Vendor Intelligence"
      title="Vendor Network"
      description="Live campaign vendor coverage, FEC spending intelligence, performance scoring, operational readiness, and execution tasking."
      tickerItems={[
        {
          label: "Vendors",
          value: `${summary.total_vendors || displayRows.length || 0} live`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Coverage",
          value: `${summary.states_covered || 0} states`,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "FEC Spend",
          value: fmtMoneyShort(fecRows.reduce((sum, row) => sum + Number(row.contract_value || 0), 0)),
          dotClass: fecRows.length ? "vs-live-dot-success" : "vs-live-dot-warning",
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

        .vs-vendor-source-strip {
          padding: 0 16px 14px;
          color: rgba(203, 213, 225, 0.72);
          font-size: 12px;
          line-height: 1.45;
        }

        .vs-vendor-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .vs-vendor-group-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 32%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.48));
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.18);
          color: var(--vs-text);
          cursor: pointer;
          display: grid;
          gap: 14px;
          min-height: 154px;
          padding: 16px;
          text-align: left;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .vs-vendor-group-card:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.42);
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.28);
        }

        .vs-vendor-group-title {
          color: var(--vs-text);
          font-size: 17px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .vs-vendor-group-subtitle {
          color: rgba(203, 213, 225, 0.72);
          font-size: 12px;
          margin-top: 5px;
        }

        .vs-vendor-group-money {
          color: var(--vs-text);
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .vs-vendor-group-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
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
      {fecError ? <div className="vs-banner vs-banner-danger">{fecError}</div> : null}
      {dispatchMessage ? <div className="vs-banner">{dispatchMessage}</div> : null}

      {taskMessage ? (
        <div className="vs-banner vs-live-banner-pulse">{taskMessage}</div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard
          label="Total Vendors"
          value={summary.total_vendors || displayRows.length || 0}
          delta="Database + FEC vendor records"
          tone="up"
        />
        <StatCard
          label="FEC Vendors"
          value={fecRows.length}
          delta="Schedule B payee intelligence"
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
          delta="Spend-linked performance risk"
          tone={riskPerformanceCount ? "down" : "up"}
        />
      </div>

      <SectionCard
        title="Vendor Controls"
        subtitle="Filter the live vendor network and FEC operating expenditure vendor intelligence."
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
            {mergedStates.map((value, index) => (
              <option key={`${value}-${index}`} value={value}>
                {value}
              </option>
            ))}
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
            {mergedCategories.map((value, index) => (
              <option key={`${value}-${index}`} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.cycle}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                cycle: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="2026">2026 Cycle</option>
            <option value="2024">2024 Cycle</option>
            <option value="2022">2022 Cycle</option>
            <option value="2020">2020 Cycle</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title="FEC Vendor Spend Intelligence"
        subtitle="Campaign operating expenditure payees grouped into vendor, service, state, committee, and spend signals."
        right={<Badge tone={fecRows.length ? "active" : "demo"}>{fecLoading ? "Loading" : `${fecRows.length} FEC vendors`}</Badge>}
      >
        <div className="vs-stack">
          {fecLoading ? (
            <EmptyState text="Loading FEC vendor spend intelligence..." />
          ) : !fecRows.length ? (
            <EmptyState text="No FEC vendor spending found for the selected filters." />
          ) : (
            fecRows.slice(0, 8).map((vendor, index) => (
              <VendorRow
                key={vendor.id || vendor.vendor_id || `${vendor.vendor_name}-${index}`}
                vendor={vendor}
                onCreateCommandTask={createVendorTask}
              />
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Vendor Spend Groups"
        subtitle="FEC-imported vendors organized by Mail, Digital, Media, Compliance, Consulting, and Events."
        right={
          selectedGroup ? (
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => setSelectedGroup("")}
            >
              Show All Groups
            </button>
          ) : (
            <Badge tone="info">6 groups</Badge>
          )
        }
      >
        <div className="vs-grid-3">
          {VENDOR_GROUPS.map((group) => (
            <VendorGroupCard
              key={group}
              group={group}
              vendors={groupedVendors[group] || []}
              onOpenGroup={setSelectedGroup}
            />
          ))}
        </div>
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard
          title="FEC Spend Categories"
          subtitle="Vendor services inferred from reported operating expenditure purposes."
          right={<Badge tone="info">{fecCategories.length} categories</Badge>}
        >
          <div className="vs-stack">
            {!fecCategories.length ? (
              <EmptyState text="No FEC spend categories available." />
            ) : (
              fecCategories.slice(0, 8).map((item) => (
                <SpendCategoryRow key={item.category} item={item} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Top Vendor Performance"
          subtitle="Vendor reliability modeled from internal MailOps history or FEC spend activity."
          right={<Badge tone="accent">{effectivePerformance.length} scored</Badge>}
        >
          <div className="vs-stack">
            {performanceLoading && !fecRows.length ? (
              <EmptyState text="Loading vendor performance..." />
            ) : !effectivePerformance.length ? (
              <EmptyState text="No vendor performance history yet." />
            ) : (
              effectivePerformance.slice(0, 8).map((item) => (
                <PerformanceRow
                  key={item.id || item.vendor_id || item.vendor_name}
                  item={item}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="vs-grid-2">
        <div ref={vendorDirectoryRef}>
          <SectionCard
            title={selectedGroup ? `${selectedGroup} Vendor Directory` : "Live Vendor Directory"}
            subtitle={
              filters.state
                ? `Database and FEC-backed vendor network filtered to ${filters.state}.`
                : "Database and FEC-backed vendor network with operating coverage and status."
            }
            right={<Badge tone="accent">{visibleRows.length} shown</Badge>}
          >
            <div className="vs-stack">
              {loading && fecLoading ? (
                <EmptyState text="Loading vendors..." />
              ) : visibleRows.length === 0 ? (
                <EmptyState text="No vendors found." />
              ) : (
                visibleRows.map((vendor, index) => {
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
                      onCreateCommandTask={createVendorTask}
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
              {intelLoading && fecLoading ? (
                <EmptyState text="Loading vendor intelligence..." />
              ) : !effectiveIntel?.gaps?.length ? (
                <EmptyState text="No active vendor coverage gaps." />
              ) : (
                effectiveIntel.gaps
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
              ) : !effectiveIntel?.resolved_gaps?.length ? (
                <EmptyState text="No resolved vendor gaps yet." />
              ) : (
                effectiveIntel.resolved_gaps
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
                {effectiveIntel?.recommended_actions?.length || 0} actions
              </Badge>
            }
          >
            <div className="vs-stack">
              {!effectiveIntel?.recommended_actions?.length ? (
                <EmptyState text="No recommended vendor actions." />
              ) : (
                effectiveIntel.recommended_actions.slice(0, 6).map((action, index) => {
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

