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

const fallbackData = {
  metrics: [
    { label: "National Win Index", value: "61.8", delta: "+3.1", tone: "up" },
    { label: "Active Threats", value: "4", delta: "2 require action", tone: "down" },
    { label: "Fundraising Pulse", value: "$12.8M", delta: "+9.4%", tone: "up" },
    { label: "Persuasion Opportunity", value: "8.9", delta: "+0.8", tone: "up" }
  ],
  battlegrounds: [
    { race: "GA Senate", probability: "57%", momentum: "+2.4", risk: "Elevated", priority: "Tier 1" },
    { race: "PA Senate", probability: "54%", momentum: "+1.8", risk: "Watch", priority: "Tier 1" },
    { race: "AZ Senate", probability: "51%", momentum: "+1.1", risk: "Watch", priority: "Tier 2" }
  ],
  actions: [
    {
      title: "Deploy suburban affordability contrast",
      owner: "War Room",
      due: "Now",
      detail: "Shift message weight into metro persuadable voter clusters."
    },
    {
      title: "Escalate mail delay response",
      owner: "MailOps",
      due: "45 min",
      detail: "Coordinate with vendor and USPS contact to protect weekend delivery."
    },
    {
      title: "Refresh surrogate briefing memo",
      owner: "Comms",
      due: "2 hrs",
      detail: "Update talking points around education and cost-of-living."
    }
  ],
  feed: [
    {
      id: 1,
      time: "08:12",
      title: "Opposition affordability attack accelerating",
      source: "War Room",
      severity: "High",
      type: "warroom.threat_detected"
    },
    {
      id: 2,
      time: "08:41",
      title: "Mail delay detected at Atlanta NDC",
      source: "Mail Intelligence",
      severity: "High",
      type: "mail.delay_detected"
    },
    {
      id: 3,
      time: "09:05",
      title: "Forecast updated for GA Senate",
      source: "Forecast Engine",
      severity: "Medium",
      type: "forecast.updated"
    }
  ]
};

function badgeToneFromSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  return "default";
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

function BattlegroundRow({ row }) {
  return (
    <ResponsiveRow
      title={row.race}
      subtitle="Priority race requiring executive visibility."
      meta={[
        { label: "Win Prob.", value: row.probability },
        { label: "Momentum", value: row.momentum },
        { label: "Risk", value: row.risk },
        { label: "Priority", value: row.priority }
      ]}
      alert={
        String(row.risk || "").toLowerCase() === "elevated"
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
      right={
        <Badge tone={String(row.risk || "").toLowerCase() === "elevated" ? "danger" : "demo"}>
          {row.risk}
        </Badge>
      }
    />
  );
}

function FeedRow({ item }) {
  return (
    <ResponsiveRow
      title={item.title}
      subtitle={`${item.source}${item.type ? ` • ${item.type}` : ""}`}
      meta={[
        { label: "Time", value: item.time || "Now" },
        { label: "Severity", value: item.severity || "Info" }
      ]}
      alert={
        String(item.severity || "").toLowerCase() === "high"
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
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

export default function CommandCenter() {
  const fetcher = useCallback(() => api.commandCenter(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);
  const [liveBanner, setLiveBanner] = useState("");

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useLiveChannel("intelligence:command-center", (event) => {
    if (!event?.type) return;

    if (event.type === "warroom.threat_detected") {
      const threat = event.payload || {};
      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      setLiveBanner(
        `Live threat fused into Command Center: ${threat.title || "Threat detected"}`
      );

      setData((prev) => ({
        ...(prev || fallbackData),
        feed: dedupeFeed([
          {
            id: `cc-threat-${Date.now()}`,
            time: now,
            title: threat.title || "Threat detected",
            source: threat.source || "War Room",
            severity: threat.severity || "High",
            type: "warroom.threat_detected"
          },
          ...(prev?.feed || [])
        ]).slice(0, 8)
      }));
    }

    if (event.type === "warroom.signal_detected") {
      const signal = event.payload || {};
      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      setLiveBanner(
        `Live signal fused into Command Center: ${signal.channel || "Signal detected"}`
      );

      setData((prev) => ({
        ...(prev || fallbackData),
        feed: dedupeFeed([
          {
            id: `cc-signal-${Date.now()}`,
            time: now,
            title: signal.text || "New signal detected",
            source: signal.channel || "War Room",
            severity: "Medium",
            type: "warroom.signal_detected"
          },
          ...(prev?.feed || [])
        ]).slice(0, 8)
      }));
    }
  });

  useEffect(() => {
    if (!liveBanner) return;
    const timer = setTimeout(() => setLiveBanner(""), 5000);
    return () => clearTimeout(timer);
  }, [liveBanner]);

  const battlegrounds = useMemo(() => data?.battlegrounds || [], [data]);
  const feed = useMemo(() => data?.feed || [], [data]);
  const actions = useMemo(() => data?.actions || [], [data]);

  const highSeverityCount = feed.filter(
    (item) => String(item.severity || "").toLowerCase() === "high"
  ).length;

  return (
    <PageShell
      eyebrow="Executive Command Center"
      title="The operating system for campaign control, race velocity, and strategic response."
      description="Monitor battleground pressure, fundraising flow, narrative threats, and next-best actions across the national map from one executive view."
      demo={demoMode}
      demoText="Demo campaign is live: battleground movement, threat pressure, and execution signals are simulated for presentation."
      tickerItems={[
        {
          label: "Threats",
          value: `${highSeverityCount} high`,
          dotClass: "vs-live-dot"
        },
        {
          label: "Battlegrounds",
          value: `${battlegrounds.length} tracked`,
          dotClass: "vs-live-dot-warning"
        },
        {
          label: "Actions",
          value: `${actions.length} queued`,
          dotClass: "vs-live-dot-success"
        }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      {liveBanner ? <div className="vs-banner">{liveBanner}</div> : null}

      <div className="vs-grid-4">
        {(data?.metrics || []).map((metric, index) => (
          <StatCard
            key={`${metric.label}-${index}`}
            label={metric.label}
            value={metric.value}
            delta={metric.delta}
            tone={metric.tone}
          />
        ))}
      </div>

      <SectionCard
        title="Priority Battleground Board"
        subtitle="Top races requiring executive monitoring and rapid adjustments."
        right={<Badge tone="accent">{battlegrounds.length} tracked</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading battleground board..." />
          ) : !battlegrounds.length ? (
            <EmptyState text="No battleground data available." />
          ) : (
            battlegrounds.map((row) => (
              <BattlegroundRow key={`${row.race}-${row.priority}`} row={row} />
            ))
          )}
        </div>
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard
          title="War Room Feed"
          subtitle="Live risk, logistics, and forecast signals entering the executive terminal."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading command feed..." />
            ) : !feed.length ? (
              <EmptyState text="No live command feed items." />
            ) : (
              feed.map((item) => (
                <FeedRow key={item.id || `${item.time}-${item.title}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Executive Action Queue"
          subtitle="Highest-leverage next steps across live intelligence inputs."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading action queue..." />
            ) : !actions.length ? (
              <EmptyState text="No executive actions available." />
            ) : (
              actions.map((item, index) => (
                <ActionRow key={`${item.title}-${index}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
