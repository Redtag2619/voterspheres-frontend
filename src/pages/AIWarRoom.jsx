import React, { useCallback, useEffect, useState } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { platformApi } from "../services/api";
import useLiveChannel from "../hooks/useLiveChannel";

const fallbackData = {
  metrics: [
    { label: "Active Threats", value: "12", delta: "+3 in last 6 hrs", tone: "down" },
    { label: "Narrative Spikes", value: "7", delta: "2 containable", tone: "up" },
    { label: "Response Window", value: "43 min", delta: "Average target", tone: "neutral" },
    { label: "Signal Confidence", value: "89%", delta: "+4.1", tone: "up" }
  ],
  threats: [
    {
      id: 1,
      title: "Cost-of-living attack cluster accelerating in suburban paid media",
      severity: "High",
      source: "Ad monitoring",
      velocity: "+38%",
      recommendation: "Deploy affordability rebuttal pack across surrogates."
    },
    {
      id: 2,
      title: "Education narrative moving into mainstream local pickup",
      severity: "Medium",
      source: "Media monitoring",
      velocity: "+21%",
      recommendation: "Push validator-driven local messaging."
    }
  ],
  queue: [
    { id: 1, priority: "P1", owner: "Rapid Response", item: "Finalize affordability contrast memo", eta: "45 min" },
    { id: 2, priority: "P2", owner: "Comms", item: "Draft surrogate talking points", eta: "2 hrs" }
  ],
  signals: [
    { id: 1, time: "08:44", channel: "Cable / Clips", text: "Opposition segment repetition crossed threshold." },
    { id: 2, time: "09:12", channel: "Social / X", text: "Narrative crossover detected into persuadable clusters." }
  ]
};

function severityClass(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

function toneClass(value) {
  return String(value || "").startsWith("-") ? "down" : "up";
}

function incrementMetric(metrics, label, formatter) {
  return (metrics || []).map((metric) => {
    if (metric.label !== label) return metric;
    return formatter(metric);
  });
}

const AIWarRoom = () => {
  const fetcher = useCallback(() => platformApi.warRoom(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);
  const [liveBanner, setLiveBanner] = useState("");
  const [pulse, setPulse] = useState(false);

  useLiveChannel("intelligence:warroom", (event) => {
    if (!event?.type) return;

    if (event.type === "warroom.threat_detected") {
      const threat = event.payload || {};

      setLiveBanner(`Live threat detected: ${threat.title || "New war room threat"}`);
      setPulse(true);

      setData((prev) => ({
        ...(prev || fallbackData),
        threats: [
          {
            id: `live-threat-${Date.now()}`,
            ...threat
          },
          ...(prev?.threats || [])
        ],
        metrics: incrementMetric(prev?.metrics || fallbackData.metrics, "Active Threats", (metric) => ({
          ...metric,
          value: String(Number(metric.value || 0) + 1),
          delta: "Live threat detected",
          tone: "down"
        }))
      }));
    }

    if (event.type === "warroom.signal_detected") {
      const signal = event.payload || {};

      setLiveBanner(`Live signal detected: ${signal.channel || "New signal"}`);
      setPulse(true);

      setData((prev) => ({
        ...(prev || fallbackData),
        signals: [
          {
            id: `live-signal-${Date.now()}`,
            ...signal
          },
          ...(prev?.signals || [])
        ],
        metrics: incrementMetric(prev?.metrics || fallbackData.metrics, "Narrative Spikes", (metric) => ({
          ...metric,
          value: String(Number(metric.value || 0) + 1),
          delta: "Live signal added",
          tone: "up"
        }))
      }));
    }

    if (event.type === "warroom.queue_updated") {
      const queueItem = event.payload || {};

      setLiveBanner(`Response queue updated: ${queueItem.item || "New response item"}`);
      setPulse(true);

      setData((prev) => ({
        ...(prev || fallbackData),
        queue: [
          {
            id: `live-queue-${Date.now()}`,
            ...queueItem
          },
          ...(prev?.queue || [])
        ]
      }));
    }

    setTimeout(() => {
      setPulse(false);
    }, 1800);
  });

  useEffect(() => {
    if (!liveBanner) return;
    const timer = setTimeout(() => setLiveBanner(""), 5000);
    return () => clearTimeout(timer);
  }, [liveBanner]);

  return (
    <TerminalPage
      eyebrow="AI War Room"
      title="Detect threats early, shape the narrative fast, and move before the market does."
      description="AI War Room watches message velocity, media framing, donor sentiment, and emerging attack patterns so your campaign can respond with speed and precision."
      metrics={data?.metrics || []}
    >
      {liveBanner ? (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            pulse
              ? "border-amber-400 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {liveBanner}
        </div>
      ) : null}

      <Panel title="Live Threat Board" subtitle="Highest-priority attacks and adverse narrative acceleration">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-threat-list">
            {(data?.threats || []).map((item) => (
              <div key={item.id || item.title} className="vs-threat-item">
                <div className={`vs-threat-severity ${severityClass(item.severity)}`}>
                  {item.severity}
                </div>
                <div className="vs-threat-body">
                  <div className="vs-threat-title">{item.title}</div>
                  <div className="vs-threat-meta">
                    <span>{item.source}</span>
                    <span className={toneClass(item.velocity)}>{item.velocity}</span>
                  </div>
                  <div className="vs-threat-recommendation">{item.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Response Queue" subtitle="Immediate tactical moves for the next cycle">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-response-queue">
            {(data?.queue || []).map((item) => (
              <div key={item.id || item.item} className="vs-response-item">
                <div className="vs-response-topline">
                  <div className="vs-response-priority">{item.priority}</div>
                  <div className="vs-response-eta">{item.eta}</div>
                </div>
                <div className="vs-response-title">{item.item}</div>
                <div className="vs-response-owner">Owner: {item.owner}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Signal Stream" subtitle="Cross-channel intelligence entering the terminal" large>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-signal-stream">
            {(data?.signals || []).map((item) => (
              <div key={item.id || `${item.time}-${item.channel}`} className="vs-signal-item">
                <div className="vs-signal-time">{item.time}</div>
                <div className="vs-signal-content">
                  <div className="vs-signal-channel">{item.channel}</div>
                  <div className="vs-signal-text">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default AIWarRoom;
