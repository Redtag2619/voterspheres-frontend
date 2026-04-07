import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { useApiResource } from "../hooks/useApiResource";
import useLiveChannel from "../hooks/useLiveChannel";

const fallbackData = {
  metrics: [
    { label: "Active Threats", value: "4", delta: "2 high severity", tone: "down" },
    { label: "Narrative Spikes", value: "6", delta: "Live media crossover", tone: "up" },
    { label: "Response Window", value: "38 min", delta: "Target pace", tone: "neutral" },
    { label: "Signal Confidence", value: "92%", delta: "+ live fusion", tone: "up" }
  ],
  threats: [
    {
      id: 1,
      title: "Cost-of-living attack cluster accelerating in Atlanta media buy",
      severity: "High",
      source: "Ad monitoring",
      velocity: "+44%",
      recommendation: "Push affordability rebuttal package immediately."
    },
    {
      id: 2,
      title: "Education narrative gaining traction in local press",
      severity: "Medium",
      source: "Media monitoring",
      velocity: "+21%",
      recommendation: "Deploy validator-driven education contrast."
    }
  ],
  queue: [
    {
      id: 1,
      priority: "P1",
      owner: "Rapid Response",
      item: "Draft affordability contrast memo",
      eta: "30 min"
    },
    {
      id: 2,
      priority: "P2",
      owner: "Comms",
      item: "Refresh surrogate talking points",
      eta: "2 hrs"
    }
  ],
  signals: [
    {
      id: 1,
      time: "09:14",
      channel: "Local TV",
      text: "Opposition narrative crossed persuadable voter threshold."
    },
    {
      id: 2,
      time: "09:26",
      channel: "Digital Monitoring",
      text: "Education attack language repeating across paid and organic channels."
    }
  ]
};

function severityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  return "default";
}

function toneClass(value) {
  return String(value || "").startsWith("-") ? "vs-tone-down" : "vs-tone-up";
}

function ThreatRow({ item }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "120px auto",
          alignItems: "start"
        }}
      >
        <div>
          <Badge tone={severityTone(item.severity)}>{item.severity}</Badge>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{item.title}</div>
          <div
            style={{
              marginTop: "0.35rem",
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              fontSize: "0.85rem",
              color: "var(--vs-text-muted)"
            }}
          >
            <span>{item.source}</span>
            <span className={toneClass(item.velocity)} style={{ fontWeight: 700 }}>
              {item.velocity}
            </span>
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.92rem",
              lineHeight: 1.7,
              color: "var(--vs-text-muted)"
            }}
          >
            {item.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueRow({ item }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "90px auto 100px",
          alignItems: "start"
        }}
      >
        <div>
          <Badge tone={String(item.priority || "").toLowerCase() === "p1" ? "danger" : "accent"}>
            {item.priority}
          </Badge>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{item.item}</div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.85rem",
              color: "var(--vs-text-muted)"
            }}
          >
            Owner: {item.owner}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Badge tone="accent">{item.eta}</Badge>
        </div>
      </div>
    </div>
  );
}

function SignalRow({ item }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "80px 150px auto",
          alignItems: "start"
        }}
      >
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--vs-text-muted)" }}>
          {item.time}
        </div>

        <div>
          <Badge tone="accent">{item.channel}</Badge>
        </div>

        <div style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "var(--vs-text)" }}>
          {item.text}
        </div>
      </div>
    </div>
  );
}

export default function AIWarRoom() {
  const fetcher = useCallback(() => api.warRoom(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);
  const [liveBanner, setLiveBanner] = useState("");
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

  const threats = useMemo(() => data?.threats || [], [data]);
  const queue = useMemo(() => data?.queue || [], [data]);
  const signals = useMemo(() => data?.signals || [], [data]);

  return (
    <PageShell
      eyebrow="AI War Room"
      title="Detect threats early, shape the narrative fast, and move before the market does."
      description="AI War Room watches message velocity, media framing, donor sentiment, and emerging attack patterns so your campaign can respond with speed and precision."
      demo={demoMode}
      demoText="Demo campaign is live: threat feed, response queue, and signal stream are simulated for presentation."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      {liveBanner ? (
        <div className="vs-banner" style={{ borderColor: "var(--vs-border)", background: "var(--vs-surface)", color: "var(--vs-text)" }}>
          {liveBanner}
        </div>
      ) : null}

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
        title="Live Threat Board"
        subtitle="Highest-priority attacks and adverse narrative acceleration."
        right={<Badge tone="danger">{threats.length} threats</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading threat board..." />
          ) : !threats.length ? (
            <EmptyState text="No active threats available." />
          ) : (
            threats.map((item) => (
              <ThreatRow key={item.id || item.title} item={item} />
            ))
          )}
        </div>
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard
          title="Response Queue"
          subtitle="Immediate tactical moves for the next cycle."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading response queue..." />
            ) : !queue.length ? (
              <EmptyState text="No response queue items available." />
            ) : (
              queue.map((item) => (
                <QueueRow key={item.id || item.item} item={item} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Signal Stream"
          subtitle="Cross-channel intelligence entering the terminal."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading signal stream..." />
            ) : !signals.length ? (
              <EmptyState text="No live signals available." />
            ) : (
              signals.map((item) => (
                <SignalRow key={item.id || `${item.time}-${item.channel}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
