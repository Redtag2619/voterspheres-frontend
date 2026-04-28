import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import DemoOnboarding from "../components/demo/DemoOnboarding.jsx";
import LiveActivityStream from "../components/demo/LiveActivityStream.jsx";
import { useApiResource } from "../hooks/useApiResource";
import useLiveChannel from "../hooks/useLiveChannel";
import useRealtimeStream from "../hooks/useRealtimeStream";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";

const fallbackData = {
  metrics: [
    { label: "National Win Index", value: "61.8", delta: "+3.1", tone: "up" },
    { label: "Active Threats", value: "4", delta: "2 require action", tone: "down" },
    { label: "Fundraising Pulse", value: "$12.8M", delta: "+9.4%", tone: "up" },
    { label: "Persuasion Opportunity", value: "8.9", delta: "+0.8", tone: "up" }
  ],
  battlegrounds: [
    { race: "GA Senate", state: "Georgia", office: "Senate", probability: "57%", momentum: "+2.4", risk: "Elevated", priority: "Tier 1" },
    { race: "PA Senate", state: "Pennsylvania", office: "Senate", probability: "54%", momentum: "+1.8", risk: "Watch", priority: "Tier 1" },
    { race: "AZ Senate", state: "Arizona", office: "Senate", probability: "51%", momentum: "+1.1", risk: "Watch", priority: "Tier 2" }
  ],
  actions: [
    { title: "Deploy suburban affordability contrast", owner: "War Room", due: "Now", detail: "Shift message weight into metro persuadable voter clusters.", state: "Georgia", office: "Senate", risk: "Elevated" },
    { title: "Escalate MailOps delay response", owner: "MailOps", due: "45 min", detail: "Coordinate with vendor and USPS contacts to protect weekend delivery.", state: "Georgia", office: "Senate", risk: "Elevated" },
    { title: "Refresh surrogate briefing memo", owner: "Comms", due: "2 hrs", detail: "Update talking points around education and cost-of-living pressure.", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ],
  feed: [
    { id: 1, time: "08:12", title: "Opposition affordability attack accelerating", source: "War Room", severity: "High", type: "warroom.threat_detected", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 2, time: "08:41", title: "Mail delay detected at Atlanta NDC", source: "Mail Intelligence", severity: "High", type: "mail.delay_detected", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 3, time: "09:05", title: "Forecast updated for PA Senate", source: "Forecast Engine", severity: "Medium", type: "forecast.updated", state: "Pennsylvania", office: "Senate", risk: "Watch" },
    { id: 4, time: "09:22", title: "Vendor coverage gap flagged in AZ", source: "Vendor Intelligence", severity: "High", type: "vendor.coverage_gap", state: "Arizona", office: "Senate", risk: "Elevated" },
    { id: 5, time: "09:37", title: "Candidate contact gap requires verification", source: "Candidate Intelligence", severity: "Medium", type: "candidate.contact_gap", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ]
};

const fallbackCrossSignal = {
  summary: {
    states_tracked: 3,
    critical_states: 1,
    high_states: 2,
    vendor_gap_states: 1
  },
  top_priorities: [
    {
      state: "Georgia",
      severity: "High",
      risk: "Elevated",
      priority_score: 91,
      recommended_actions: ["Escalate MailOps response.", "Increase suburban persuasion pressure."],
      finance: { receipts: 12800000 },
      vendors: { coverage_status: "Tight" },
      mailops: { mail_risks: 2 }
    },
    {
      state: "Arizona",
      severity: "High",
      risk: "Elevated",
      priority_score: 84,
      recommended_actions: ["Audit vendor coverage.", "Prepare backup vendor lane."],
      finance: { receipts: 9400000 },
      vendors: { coverage_status: "Gap" },
      mailops: { mail_risks: 1 }
    },
    {
      state: "Pennsylvania",
      severity: "Medium",
      risk: "Watch",
      priority_score: 76,
      recommended_actions: ["Verify candidate contacts.", "Refresh surrogate memo."],
      finance: { receipts: 11100000 },
      vendors: { coverage_status: "Stable" },
      mailops: { mail_risks: 0 }
    }
  ],
  results: []
};

function badgeToneFromSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high" || v === "elevated" || v === "severe") return "danger";
  if (v === "medium" || v === "watch") return "demo";
  return "default";
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function dedupeFeed(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type || ""}-${item.title || ""}-${item.time || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesFilters(item, filters) {
  if (!item) return false;
  if (filters.state && item.state !== filters.state) return false;
  if (filters.office && item.office !== filters.office) return false;
  if (filters.risk && item.risk !== filters.risk) return false;
  return true;
}

function getActionClass(action) {
  const value = String(action || "").toLowerCase();

  if (value.includes("escalate")) return "vs-decision-btn escalate";
  if (value.includes("audit")) return "vs-decision-btn audit";
  if (value.includes("deploy")) return "vs-decision-btn deploy";
  if (value.includes("activate")) return "vs-decision-btn activate";
  if (value.includes("verify") || value.includes("refresh")) return "vs-decision-btn verify";

  return "vs-decision-btn";
}

function buildExecutiveDecision({ feed = [] }) {
  if (!feed.length) return null;

  const high = feed.find((item) =>
    ["high", "critical"].includes(String(item.severity || "").toLowerCase())
  );

  if (!high) return null;

  const state = high.state || "Priority State";
  const type = String(high.type || "").toLowerCase();

  if (type.includes("mail")) {
    return {
      level: "CRITICAL",
      title: `${state} MailOps disruption detected`,
      actions: ["Escalate logistics response", "Contact USPS political desk", "Shift delivery windows"]
    };
  }

  if (type.includes("vendor")) {
    return {
      level: "HIGH",
      title: `${state} vendor coverage instability`,
      actions: ["Audit vendor coverage", "Deploy backup vendor", "Escalate operations"]
    };
  }

  if (type.includes("candidate")) {
    return {
      level: "HIGH",
      title: `${state} candidate intelligence gap`,
      actions: ["Refresh candidate profile", "Verify contact records", "Assign analyst review"]
    };
  }

  return {
    level: "HIGH",
    title: `${state} campaign pressure rising`,
    actions: ["Deploy message shift", "Increase media weight", "Activate surrogate network"]
  };
}

function BattlegroundRow({ row, active = false }) {
  return (
    <ResponsiveRow
      active={active}
      title={row.race}
      subtitle="Priority race requiring executive visibility."
      meta={[
        { label: "Win Prob.", value: row.probability },
        { label: "Momentum", value: row.momentum },
        { label: "Risk", value: row.risk },
        { label: "Priority", value: row.priority }
      ]}
      alert={String(row.risk || "").toLowerCase() === "elevated" ? "vs-live-dot" : "vs-live-dot-warning"}
      right={<Badge tone={String(row.risk || "").toLowerCase() === "elevated" ? "danger" : "demo"}>{row.risk}</Badge>}
    />
  );
}

function FeedRow({ item, live = false }) {
  return (
    <ResponsiveRow
      live={live}
      title={item.title}
      subtitle={`${item.source}${item.type ? ` • ${item.type}` : ""}`}
      meta={[
        { label: "Time", value: item.time || "Now" },
        { label: "Severity", value: item.severity || "Info" }
      ]}
      alert={String(item.severity || "").toLowerCase() === "high" ? "vs-live-dot" : "vs-live-dot-warning"}
      right={<Badge tone={badgeToneFromSeverity(item.severity)}>{item.severity}</Badge>}
    />
  );
}

function ActionRow({ item }) {
  return (
    <ResponsiveRow
      title={item.title}
      subtitle={item.detail}
      meta={[
        { label: "Owner", value: item.owner },
        { label: "Due", value: item.due }
      ]}
      alert="vs-live-dot-success"
      right={<Badge tone="accent">{item.due}</Badge>}
    />
  );
}

function PriorityRow({ item, index }) {
  return (
    <ResponsiveRow
      title={`#${index + 1} ${item.state} — ${item.severity}`}
      subtitle={(item.recommended_actions || []).join(" ") || "Multiple intelligence signals require executive review."}
      meta={[
        { label: "Score", value: item.priority_score },
        { label: "Receipts", value: formatMoney(item.finance?.receipts) },
        { label: "Vendors", value: item.vendors?.coverage_status || "—" },
        { label: "Mail Risk", value: item.mailops?.mail_risks || 0 }
      ]}
      alert={["Critical", "High"].includes(item.severity) ? "vs-live-dot" : "vs-live-dot-warning"}
      right={<Badge tone={badgeToneFromSeverity(item.severity)}>{item.risk}</Badge>}
    />
  );
}

export default function CommandCenter() {
  const fetcher = useCallback(() => api.commandCenter(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);

  const [crossSignal, setCrossSignal] = useState(fallbackCrossSignal);
  const [crossLoading, setCrossLoading] = useState(true);
  const [liveBanner, setLiveBanner] = useState("");
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveFeedIds, setLiveFeedIds] = useState([]);
  const [liveBattlegroundStates, setLiveBattlegroundStates] = useState([]);

  const { filters } = useExecutiveFilters();

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  const effectiveData = demoMode ? fallbackData : data || fallbackData;
  const effectiveCrossSignal = demoMode ? fallbackCrossSignal : crossSignal || fallbackCrossSignal;

  useEffect(() => {
    let active = true;

    async function loadCrossSignal() {
      if (demoMode) {
        setCrossSignal(fallbackCrossSignal);
        setCrossLoading(false);
        return;
      }

      try {
        setCrossLoading(true);
        const response = api.crossSignalIntelligence
          ? await api.crossSignalIntelligence()
          : (await api.get("/intelligence/cross-signal")).data;

        if (!active) return;
        setCrossSignal(response || fallbackCrossSignal);
      } catch {
        if (!active) return;
        setCrossSignal(fallbackCrossSignal);
      } finally {
        if (active) setCrossLoading(false);
      }
    }

    loadCrossSignal();

    return () => {
      active = false;
    };
  }, [demoMode]);

  useLiveChannel("intelligence:command-center", (event) => {
    if (!event?.type) return;

    if (event.type === "warroom.threat_detected") {
      const threat = event.payload || {};
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const liveId = `cc-threat-${Date.now()}`;

      setLiveBanner(`Live threat fused into Command Center: ${threat.title || "Threat detected"}`);
      setLiveFeedIds((prev) => [liveId, ...prev].slice(0, 8));
      setLiveBattlegroundStates((prev) => [
        threat.state || "Georgia",
        ...prev.filter((item) => item !== (threat.state || "Georgia"))
      ].slice(0, 5));

      setData((prev) => ({
        ...(prev || fallbackData),
        feed: dedupeFeed([
          {
            id: liveId,
            time: now,
            title: threat.title || "Threat detected",
            source: threat.source || "War Room",
            severity: threat.severity || "High",
            type: "warroom.threat_detected",
            state: threat.state || "Georgia",
            office: threat.office || "Senate",
            risk: threat.risk || "Elevated"
          },
          ...(prev?.feed || [])
        ]).slice(0, 8)
      }));
    }
  });

  useRealtimeStream(null, (event) => {
    const alert = event?.payload?.alert || event?.payload?.event || null;
    if (!alert) return;

    const liveId = event.id || `live-${Date.now()}`;

    setLiveBanner(`Realtime alert fused into Command Center: ${alert.title || "New signal"}`);
    setLiveFeedIds((prev) => [liveId, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      alert.state || "National",
      ...prev.filter((item) => item !== (alert.state || "National"))
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: liveId,
        time: new Date(event.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: alert.title || "Realtime intelligence signal",
        source: alert.source || "Realtime",
        severity: alert.severity || "Medium",
        type: alert.event_type || event.type || "alert.dispatched",
        state: alert.state || "National",
        office: alert.office || "Statewide",
        risk: alert.risk || "Watch"
      },
      ...prev
    ].slice(0, 8));
  });

  function handleDemoSignal(signal) {
    const liveId = signal.id || `demo-live-${Date.now()}`;

    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);
    setLiveFeedIds((prev) => [liveId, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: liveId,
        time: signal.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: signal.title,
        source: signal.source,
        severity: signal.severity,
        type: "demo.signal",
        state: signal.state,
        office: signal.office,
        risk: signal.risk
      },
      ...prev
    ].slice(0, 8));
  }

  function injectLocalSignal(signal = {}) {
    const liveId = `exec-${Date.now()}`;

    setLiveBanner(signal.title || "Command action executed");
    setLiveFeedIds((prev) => [liveId, ...prev].slice(0, 8));

    if (signal.state) {
      setLiveBattlegroundStates((prev) => [
        signal.state,
        ...prev.filter((item) => item !== signal.state)
      ].slice(0, 5));
    }

    setLiveAlerts((prev) => [
      {
        id: liveId,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: signal.title || "Command action executed",
        source: signal.source || "Execution Engine",
        severity: signal.severity || "Medium",
        type: signal.type || "command.action",
        state: signal.state || "National",
        office: signal.office || "Statewide",
        risk: signal.risk || "Watch"
      },
      ...prev
    ].slice(0, 8));
  }

  async function handleActionClick(action, context = {}) {
    const text = String(action || "").toLowerCase();

    if (text.includes("candidate") || text.includes("profile") || text.includes("contact")) {
      injectLocalSignal({
        title: `Candidate action queued: ${action}`,
        severity: "Medium",
        source: "Candidate Intelligence",
        state: context.state,
        office: context.office,
        risk: "Watch"
      });

      window.location.href = `/candidates?candidate=${encodeURIComponent(context.candidate_name || "")}&context=command-center`;
      return;
    }

    if (text.includes("alert") || text.includes("escalate")) {
      try {
        await api.dispatchAlerts?.({ limit: 1 });
      } catch {
        // Local execution still succeeds if backend dispatch is unavailable.
      }

      injectLocalSignal({
        title: `Alert dispatched: ${action}`,
        severity: "High",
        source: "Command Center",
        state: context.state,
        office: context.office,
        risk: "Elevated"
      });
      return;
    }

    if (text.includes("assign") || text.includes("deploy") || text.includes("activate")) {
      injectLocalSignal({
        title: `Task assigned: ${action}`,
        severity: "Medium",
        source: "Execution Engine",
        state: context.state,
        office: context.office,
        risk: "Watch"
      });
      return;
    }

    injectLocalSignal({
      title: `Action executed: ${action}`,
      severity: "Medium",
      source: "Command Center",
      state: context.state,
      office: context.office,
      risk: context.risk || "Watch"
    });
  }

  useEffect(() => {
    if (!liveBanner) return;
    const timer = setTimeout(() => setLiveBanner(""), 5000);
    return () => clearTimeout(timer);
  }, [liveBanner]);

  useEffect(() => {
    if (!liveFeedIds.length && !liveBattlegroundStates.length) return;

    const timer = setTimeout(() => {
      setLiveFeedIds([]);
      setLiveBattlegroundStates([]);
    }, 5200);

    return () => clearTimeout(timer);
  }, [liveFeedIds, liveBattlegroundStates]);

  const battlegrounds = useMemo(
    () => (effectiveData?.battlegrounds || []).filter((item) => matchesFilters(item, filters)),
    [effectiveData, filters]
  );

  const feed = useMemo(
    () =>
      dedupeFeed([...(liveAlerts || []), ...(effectiveData?.feed || [])]).filter((item) =>
        matchesFilters(item, filters)
      ),
    [effectiveData, liveAlerts, filters]
  );

  const actions = useMemo(
    () => (effectiveData?.actions || []).filter((item) => matchesFilters(item, filters)),
    [effectiveData, filters]
  );

  const topPriorities = useMemo(() => {
    return (effectiveCrossSignal?.top_priorities || []).filter((item) => {
      if (filters.state && item.state !== filters.state) return false;
      if (filters.risk && item.risk !== filters.risk && item.severity !== filters.risk) return false;
      return true;
    });
  }, [effectiveCrossSignal, filters]);

  const highSeverityCount = feed.filter((item) =>
    ["high", "critical"].includes(String(item.severity || "").toLowerCase())
  ).length;

  const executiveDecision = useMemo(() => {
    try {
      return buildExecutiveDecision({ feed, battlegrounds });
    } catch {
      return null;
    }
  }, [feed, battlegrounds]);

  const crossMetrics = useMemo(() => {
    const summary = effectiveCrossSignal?.summary || {};

    return [
      { label: "Tracked States", value: summary.states_tracked || 0, delta: "Cross-signal engine", tone: "up" },
      { label: "Critical States", value: summary.critical_states || 0, delta: "Immediate review", tone: summary.critical_states ? "down" : "up" },
      { label: "High States", value: summary.high_states || 0, delta: "Priority markets", tone: summary.high_states ? "down" : "up" },
      { label: "Vendor Gap States", value: summary.vendor_gap_states || 0, delta: "Coverage pressure", tone: summary.vendor_gap_states ? "down" : "up" }
    ];
  }, [effectiveCrossSignal]);

  return (
    <PageShell
      eyebrow="Executive Command Center"
      title="Campaign control, race velocity, and strategic response in one operating view."
      description="Monitor battleground pressure, fundraising movement, narrative threats, vendor gaps, MailOps risk, and next-best actions across one executive command surface."
      demo={demoMode}
      demoText="Demo campaign is live: battleground movement, threat pressure, and execution signals are simulated for presentation."
      tickerItems={[
        { label: "Threats", value: `${highSeverityCount} high`, dotClass: "vs-live-dot" },
        { label: "Priorities", value: `${topPriorities.length} ranked`, dotClass: "vs-live-dot-warning" },
        { label: "Actions", value: `${actions.length} queued`, dotClass: "vs-live-dot-success" }
      ]}
    >
      {error && !demoMode ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {liveBanner ? <div className="vs-banner vs-live-banner-pulse">{liveBanner}</div> : null}

      <DemoOnboarding />
      <LiveActivityStream onSignal={handleDemoSignal} />

      {executiveDecision ? (
        <div className={`vs-decision-panel ${String(executiveDecision.level || "").toLowerCase()}`}>
          <div className="vs-decision-header">
            <span className="vs-decision-level">{executiveDecision.level}</span>
            <span className="vs-decision-title">{executiveDecision.title}</span>
          </div>

          <div className="vs-decision-actions">
            {executiveDecision.actions.map((action, index) => (
              <button
                key={`${action}-${index}`}
                className={getActionClass(action)}
                type="button"
                onClick={() =>
                  handleActionClick(action, {
                    state: feed?.[0]?.state,
                    office: feed?.[0]?.office,
                    risk: feed?.[0]?.risk
                  })
                }
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="vs-grid-4">
        {(effectiveData?.metrics || []).map((metric, index) => (
          <StatCard key={`${metric.label}-${index}`} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone} />
        ))}
      </div>

      <SectionCard
        title="Cross-Signal Priority Layer"
        subtitle="Highest-pressure states ranked from fundraising, vendor coverage, MailOps risk, and executive feed signals."
        right={<Badge tone="danger">{topPriorities.length} ranked</Badge>}
      >
        <div className="vs-grid-4" style={{ marginBottom: 16 }}>
          {crossMetrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="vs-stack">
          {!demoMode && crossLoading ? (
            <EmptyState text="Loading cross-signal priority engine..." />
          ) : !topPriorities.length ? (
            <EmptyState text="No cross-signal priorities available for the current filters." />
          ) : (
            topPriorities.slice(0, 6).map((item, index) => (
              <PriorityRow key={`${item.state}-${index}`} item={item} index={index} />
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Priority Battleground Board"
        subtitle="Top races requiring executive monitoring and rapid adjustment."
        right={<Badge tone="accent">{battlegrounds.length} tracked</Badge>}
      >
        <div className="vs-stack">
          {!demoMode && loading ? (
            <EmptyState text="Loading battleground board..." />
          ) : !battlegrounds.length ? (
            <EmptyState text="No battleground data available for the current filters." />
          ) : (
            battlegrounds.map((row) => (
              <BattlegroundRow
                key={`${row.race}-${row.priority}`}
                row={row}
                active={
                  liveBattlegroundStates.includes(row.state) ||
                  liveBattlegroundStates.includes(String(row.state || "").slice(0, 2))
                }
              />
            ))
          )}
        </div>
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard title="War Room Feed" subtitle="Live risk, logistics, forecast, and alert signals entering the executive terminal.">
          <div className="vs-stack">
            {!demoMode && loading ? (
              <EmptyState text="Loading command feed..." />
            ) : !feed.length ? (
              <EmptyState text="No live command feed items for the current filters." />
            ) : (
              feed.map((item) => (
                <FeedRow
                  key={item.id || `${item.time}-${item.title}`}
                  item={item}
                  live={liveFeedIds.includes(item.id)}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Executive Action Queue" subtitle="Highest-leverage next steps across active intelligence inputs.">
          <div className="vs-stack">
            {!demoMode && loading ? (
              <EmptyState text="Loading action queue..." />
            ) : !actions.length ? (
              <EmptyState text="No executive actions available for the current filters." />
            ) : (
              actions.map((item, index) => <ActionRow key={`${item.title}-${index}`} item={item} />)
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
