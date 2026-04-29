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
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";

const fallbackData = {
  metrics: [
    { label: "Active Threats", value: "4", delta: "2 high severity", tone: "down" },
    { label: "Narrative Spikes", value: "6", delta: "Live media crossover", tone: "up" },
    { label: "Response Window", value: "38 min", delta: "Target pace", tone: "neutral" },
    { label: "Signal Confidence", value: "92%", delta: "+ live fusion", tone: "up" }
  ],
  threats: [
    { id: 1, title: "Cost-of-living attack cluster accelerating in Atlanta media buy", severity: "High", source: "Ad monitoring", velocity: "+44%", recommendation: "Push affordability rebuttal package immediately.", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 2, title: "Education narrative gaining traction in local press", severity: "Medium", source: "Media monitoring", velocity: "+21%", recommendation: "Deploy validator-driven education contrast.", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ],
  queue: [
    { id: 1, priority: "P1", owner: "Rapid Response", item: "Draft affordability contrast memo", eta: "30 min", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 2, priority: "P2", owner: "Comms", item: "Refresh surrogate talking points", eta: "2 hrs", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ],
  signals: [
    { id: 1, time: "09:14", channel: "Local TV", text: "Opposition narrative crossed persuadable voter threshold.", state: "Georgia", office: "Senate", risk: "Elevated" },
    { id: 2, time: "09:26", channel: "Digital Monitoring", text: "Education attack language repeating across paid and organic channels.", state: "Pennsylvania", office: "Senate", risk: "Watch" }
  ]
};

function severityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  return "default";
}

function matchesFilters(item, filters) {
  if (!item) return false;
  if (filters.state && item.state !== filters.state) return false;
  if (filters.office && item.office !== filters.office) return false;
  if (filters.risk && item.risk !== filters.risk) return false;
  return true;
}

function ThreatRow({ item }) {
  return (
    <ResponsiveRow
      title={item.title}
      subtitle={item.recommendation}
      meta={[
        { label: "Severity", value: item.severity || "Info" },
        { label: "Source", value: item.source || "—" },
        { label: "Velocity", value: item.velocity || "—" },
        { label: "Risk", value: item.risk || "Watch" }
      ]}
      alert={
        String(item.severity || "").toLowerCase() === "high"
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
      right={<Badge tone={severityTone(item.severity)}>{item.severity || "Info"}</Badge>}
    />
  );
}

function QueueRow({ item }) {
  return (
    <ResponsiveRow
      title={item.item}
      subtitle={`Owner: ${item.owner}`}
      meta={[
        { label: "Priority", value: item.priority || "—" },
        { label: "Owner", value: item.owner || "—" },
        { label: "ETA", value: item.eta || "—" },
        { label: "Risk", value: item.risk || "Watch" }
      ]}
      alert={
        String(item.priority || "").toLowerCase() === "p1"
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
      right={
        <Badge tone={String(item.priority || "").toLowerCase() === "p1" ? "danger" : "accent"}>
          {item.priority || "P2"}
        </Badge>
      }
    />
  );
}

function SignalRow({ item }) {
  return (
    <ResponsiveRow
      title={item.channel}
      subtitle={item.text}
      meta={[
        { label: "Time", value: item.time || "Now" },
        { label: "Channel", value: item.channel || "—" },
        { label: "State", value: item.state || "National" },
        { label: "Risk", value: item.risk || "Watch" }
      ]}
      alert="vs-live-dot-success"
      right={<Badge tone="info">{item.channel || "Signal"}</Badge>}
    />
  );
}

function SignalRow({ item }) {
  return (
    <ResponsiveRow
      title={item.channel}
      subtitle={item.text}
      meta={[{ label: "Time", value: item.time }]}
      alert="vs-live-dot-success"
      right={<Badge tone="info">{item.channel}</Badge>}
    />
  );
}

export default function AIWarRoom() {
  const fetcher = useCallback(() => api.warRoom(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);
  const [liveBanner, setLiveBanner] = useState("");
  const { filters } = useExecutiveFilters();

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useLiveChannel("intelligence:warroom", (event) => {
    if (!event?.type) return;

    if (event.type === "warroom.threat_detected") {
      const threat = event.payload || {};
      setLiveBanner(`Live threat detected: ${threat.title || "New war room threat"}`);

      setData((prev) => ({
        ...(prev || fallbackData),
        threats: [
          {
            id: `live-threat-${Date.now()}`,
            state: threat.state || "Georgia",
            office: threat.office || "Senate",
            risk: threat.risk || "Elevated",
            ...threat
          },
          ...(prev?.threats || [])
        ].slice(0, 8)
      }));
    }

    if (event.type === "warroom.signal_detected") {
      const signal = event.payload || {};
      setLiveBanner(`Live signal detected: ${signal.channel || "New signal"}`);

      setData((prev) => ({
        ...(prev || fallbackData),
        signals: [
          {
            id: `live-signal-${Date.now()}`,
            state: signal.state || "Georgia",
            office: signal.office || "Senate",
            risk: signal.risk || "Elevated",
            ...signal
          },
          ...(prev?.signals || [])
        ].slice(0, 8)
      }));
    }
  });

  useEffect(() => {
    if (!liveBanner) return;
    const timer = setTimeout(() => setLiveBanner(""), 5000);
    return () => clearTimeout(timer);
  }, [liveBanner]);

  const threats = useMemo(() => (data?.threats || []).filter((item) => matchesFilters(item, filters)), [data, filters]);
  const queue = useMemo(() => (data?.queue || []).filter((item) => matchesFilters(item, filters)), [data, filters]);
  const signals = useMemo(() => (data?.signals || []).filter((item) => matchesFilters(item, filters)), [data, filters]);

  const highThreats = threats.filter(
    (item) => String(item.severity || "").toLowerCase() === "high"
  ).length;

  return (
    <PageShell
      eyebrow="AI War Room"
      title="Detect threats early, shape the narrative fast, and move before the market does."
      description="AI War Room watches message velocity, media framing, donor sentiment, and emerging attack patterns so your campaign can respond with speed and precision."
      demo={demoMode}
      demoText="Demo campaign is live: threat feed, response queue, and signal stream are simulated for presentation."
      tickerItems={[
        { label: "High Threats", value: `${highThreats}`, dotClass: "vs-live-dot" },
        { label: "Response Queue", value: `${queue.length} live`, dotClass: "vs-live-dot-warning" },
        { label: "Signal Stream", value: `${signals.length} active`, dotClass: "vs-live-dot-success" }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {liveBanner ? <div className="vs-banner">{liveBanner}</div> : null}

      <div className="vs-grid-4">
        {(data?.metrics || []).map((metric, index) => (
          <StatCard key={`${metric.label}-${index}`} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone} />
        ))}
      </div>

      <SectionCard title="Live Threat Board" subtitle="Highest-priority attacks and adverse narrative acceleration." right={<Badge tone="danger">{threats.length} threats</Badge>}>
        <div className="vs-stack">
          {loading ? <EmptyState text="Loading threat board..." /> : !threats.length ? <EmptyState text="No active threats available for the current filters." /> : threats.map((item) => <ThreatRow key={item.id || item.title} item={item} />)}
        </div>
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard title="Response Queue" subtitle="Immediate tactical moves for the next cycle.">
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading response queue..." /> : !queue.length ? <EmptyState text="No response queue items available for the current filters." /> : queue.map((item) => <QueueRow key={item.id || item.item} item={item} />)}
          </div>
        </SectionCard>

        <SectionCard title="Signal Stream" subtitle="Cross-channel intelligence entering the terminal.">
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading signal stream..." /> : !signals.length ? <EmptyState text="No live signals available for the current filters." /> : signals.map((item) => <SignalRow key={item.id || `${item.time}-${item.channel}`} item={item} />)}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
