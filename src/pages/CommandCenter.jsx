import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
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
    { title: "Escalate mail delay response", owner: "MailOps", due: "45 min", detail: "Coordinate with vendor and USPS contact to protect weekend delivery.", state: "Georgia", office: "Senate", risk: "Elevated" },
    { title: "Refresh surrogate briefing memo", owner: "Comms", due: "2 hrs", detail: "Update talking points around education and cost-of-living.", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ],
  feed: [
    { id: 1, time: "08:12", title: "Opposition affordability attack accelerating", source: "War Room", severity: "High", type: "warroom.threat_detected", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 2, time: "08:41", title: "Mail delay detected at Atlanta NDC", source: "Mail Intelligence", severity: "High", type: "mail.delay_detected", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 3, time: "09:05", title: "Forecast updated for PA Senate", source: "Forecast Engine", severity: "Medium", type: "forecast.updated", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ]
};

const fallbackCrossSignal = {
  summary: {},
  top_priorities: [],
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

function BattlegroundRow({ row, active = false }) {
  function handleDemoSignal(signal) {
    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);

    setLiveFeedIds((prev) => [signal.id, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: signal.id || `demo-live-${Date.now()}`,
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

  return (
    <ResponsiveRow
      title={row.race} active={active}
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
  function handleDemoSignal(signal) {
    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);

    setLiveFeedIds((prev) => [signal.id, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: signal.id || `demo-live-${Date.now()}`,
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

  return (
    <ResponsiveRow
      title={item.title} live={live}
      subtitle={`${item.source}${item.type ? ` â€¢ ${item.type}` : ""}`}
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
  function handleDemoSignal(signal) {
    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);

    setLiveFeedIds((prev) => [signal.id, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: signal.id || `demo-live-${Date.now()}`,
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

  return (
    <ResponsiveRow
      title={item.title} live={live}
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
  function handleDemoSignal(signal) {
    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);

    setLiveFeedIds((prev) => [signal.id, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: signal.id || `demo-live-${Date.now()}`,
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

  return (
    <ResponsiveRow
      title={`#${index + 1} ${item.state} â€” ${item.severity}`}
      subtitle={(item.recommended_actions || []).join(" ") || "Multiple intelligence signals require executive review."}
      meta={[
        { label: "Score", value: item.priority_score },
        { label: "Receipts", value: formatMoney(item.finance?.receipts) },
        { label: "Vendors", value: item.vendors?.coverage_status || "â€”" },
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

  useEffect(() => {
    let active = true;

    async function loadCrossSignal() {
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
  function handleDemoSignal(signal) {
    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);

    setLiveFeedIds((prev) => [signal.id, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: signal.id || `demo-live-${Date.now()}`,
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

  return () => {
      active = false;
    };
  }, []);

  useLiveChannel("intelligence:command-center", (event) => {
    if (!event?.type) return;

    if (event.type === "warroom.threat_detected") {
      const threat = event.payload || {};
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setLiveBanner(`Live threat fused into Command Center: ${threat.title || "Threat detected"}`);

      setData((prev) => ({
        ...(prev || fallbackData),
        feed: dedupeFeed([
          {
            id: `cc-threat-${Date.now()}`,
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

    setLiveBanner(`Realtime alert fused into Command Center: ${alert.title || "New signal"}`);

    setLiveAlerts((prev) => [
      {
        id: event.id || `live-${Date.now()}`,
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

  useEffect(() => {
    if (!liveBanner) return;
    const timer = setTimeout(() => setLiveBanner(""), 5000);
  function handleDemoSignal(signal) {
    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);

    setLiveFeedIds((prev) => [signal.id, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: signal.id || `demo-live-${Date.now()}`,
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

  return () => clearTimeout(timer);
  }, [liveBanner]);

  const battlegrounds = useMemo(() => (data?.battlegrounds || []).filter((item) => matchesFilters(item, filters)), [data, filters]);
  const feed = useMemo(() => dedupeFeed([...(liveAlerts || []), ...(data?.feed || [])]).filter((item) => matchesFilters(item, filters)), [data, liveAlerts, filters]);
  const actions = useMemo(() => (data?.actions || []).filter((item) => matchesFilters(item, filters)), [data, filters]);

  const topPriorities = useMemo(() => {
  function handleDemoSignal(signal) {
    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);

    setLiveFeedIds((prev) => [signal.id, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: signal.id || `demo-live-${Date.now()}`,
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

  return (crossSignal?.top_priorities || []).filter((item) => {
      if (filters.state && item.state !== filters.state) return false;
      if (filters.risk && item.risk !== filters.risk && item.severity !== filters.risk) return false;
      return true;
    });
  }, [crossSignal, filters]);

  const highSeverityCount = feed.filter(
    (item) => ["high", "critical"].includes(String(item.severity || "").toLowerCase())
  ).length;

  const crossMetrics = useMemo(() => {
    const summary = crossSignal?.summary || {};
    return [
      {
        label: "Tracked States",
        value: summary.states_tracked || 0,
        delta: "Cross-signal engine",
        tone: "up"
      },
      {
        label: "Critical States",
        value: summary.critical_states || 0,
        delta: "Immediate review",
        tone: summary.critical_states ? "down" : "up"
      },
      {
        label: "High States",
        value: summary.high_states || 0,
        delta: "Priority markets",
        tone: summary.high_states ? "down" : "up"
      },
      {
        label: "Vendor Gap States",
        value: summary.vendor_gap_states || 0,
        delta: "Coverage pressure",
        tone: summary.vendor_gap_states ? "down" : "up"
      }
    ];
  }, [crossSignal]);
  function handleDemoSignal(signal) {
    setLiveBanner(`Demo signal fused into Command Center: ${signal.title}`);

    setLiveFeedIds((prev) => [signal.id, ...prev].slice(0, 8));
    setLiveBattlegroundStates((prev) => [
      signal.state,
      ...prev.filter((item) => item !== signal.state)
    ].slice(0, 5));

    setLiveAlerts((prev) => [
      {
        id: signal.id || `demo-live-${Date.now()}`,
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

  return (
    <PageShell
      eyebrow="Executive Command Center"
      title="The operating system for campaign control, race velocity, and strategic response."
      description="Monitor battleground pressure, fundraising flow, narrative threats, vendor gaps, MailOps risk, and next-best actions across one executive view."
      demo={demoMode}
      demoText="Demo campaign is live: battleground movement, threat pressure, and execution signals are simulated for presentation."
      tickerItems={[
        { label: "Threats", value: `${highSeverityCount} high`, dotClass: "vs-live-dot" },
        { label: "Priorities", value: `${topPriorities.length} ranked`, dotClass: "vs-live-dot-warning" },
        { label: "Actions", value: `${actions.length} queued`, dotClass: "vs-live-dot-success" }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {liveBanner ? <div className="vs-banner vs-live-banner-pulse">{liveBanner}</div> : null}

      <div className="vs-grid-4">
        {(data?.metrics || []).map((metric, index) => (
          <StatCard key={`${metric.label}-${index}`} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone} />
        ))}
      </div>

      <SectionCard
        title="Cross-Signal Priority Layer"
        subtitle="Highest-pressure states ranked from fundraising, vendor coverage, MailOps risk, and live executive feed signals."
        right={<Badge tone="danger">{topPriorities.length} ranked</Badge>}
      >
        <div className="vs-grid-4" style={{ marginBottom: 16 }}>
          {crossMetrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="vs-stack">
          {crossLoading ? (
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
        subtitle="Top races requiring executive monitoring and rapid adjustments."
        right={<Badge tone="accent">{battlegrounds.length} tracked</Badge>}
      >
        <div className="vs-stack">
          {loading ? <EmptyState text="Loading battleground board..." /> : !battlegrounds.length ? <EmptyState text="No battleground data available for the current filters." /> : battlegrounds.map((row) => <BattlegroundRow key={`${row.race}-${row.priority}`} row={row} active={liveBattlegroundStates.includes(row.state) || liveBattlegroundStates.includes(String(row.state || "").slice(0, 2))} />)}
        </div>
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard title="War Room Feed" subtitle="Live risk, logistics, forecast, and realtime alert signals entering the executive terminal.">
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading command feed..." /> : !feed.length ? <EmptyState text="No live command feed items for the current filters." /> : feed.map((item) => <FeedRow key={item.id || `${item.time}-${item.title}`} item={item} live={liveFeedIds.includes(item.id)} />)}
          </div>
        </SectionCard>

        <SectionCard title="Executive Action Queue" subtitle="Highest-leverage next steps across live intelligence inputs.">
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading action queue..." /> : !actions.length ? <EmptyState text="No executive actions available for the current filters." /> : actions.map((item, index) => <ActionRow key={`${item.title}-${index}`} item={item} />)}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}


