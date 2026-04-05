import React, { useCallback, useEffect, useState } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";
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

function severityClass(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

function toneClass(value) {
  return String(value || "").startsWith("-") ? "down" : "up";
}

const AIWarRoom = () => {
  const fetcher = useCallback(() => api.warRoom(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);
  const [liveBanner, setLiveBanner] = useState("");
  const demoMode = localStorage.getItem("vs_demo_mode") === "1";

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

  return (
    <TerminalPage
      eyebrow="AI War Room"
      title="Detect threats early, shape the narrative fast, and move before the market does."
      description="AI War Room watches message velocity, media framing, donor sentiment, and emerging attack patterns so your campaign can respond with speed and precision."
      metrics={data?.metrics || []}
    >
      {demoMode ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo campaign is live: threat feed, response queue, and signal stream are simulated for presentation.
        </div>
      ) : null}

      {liveBanner ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {liveBanner}
        </div>
      ) : null}

      <Panel title="Live Threat Board" subtitle="Highest-priority attacks and adverse narrative acceleration">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-threat-list">
            {(data?.threats || []).map((item) => (
              <div key={item.id || item.title} className="vs-threat-item">
                <div className={`vs-threat-severity ${severityClass(item.severity)}`}>{item.severity}</div>
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
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
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
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
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
