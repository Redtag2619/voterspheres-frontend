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
    { label: "National Win Index", value: "61.4", delta: "+2.8", tone: "up" },
    { label: "Active Threats", value: "12", delta: "+3", tone: "down" },
    { label: "Fundraising Pulse", value: "$12.6M", delta: "+11.2%", tone: "up" },
    { label: "Persuasion Opportunity", value: "8.7", delta: "+0.6", tone: "up" }
  ],
  battlegrounds: [
    { race: "PA Senate", probability: "54%", momentum: "+2.1", risk: "Elevated", priority: "Tier 1" },
    { race: "AZ-01", probability: "51%", momentum: "+1.4", risk: "Watch", priority: "Tier 1" },
    { race: "MI-07", probability: "49%", momentum: "-0.8", risk: "High", priority: "Tier 1" }
  ],
  actions: [
    {
      title: "Reallocate persuasion spend",
      owner: "Paid Media",
      due: "Today",
      detail: "Shift 14% of digital spend into three suburban battleground segments."
    },
    {
      title: "Deploy rapid-response package",
      owner: "War Room",
      due: "2 hrs",
      detail: "Push education-cost rebuttal kit to surrogates and state comms leads."
    }
  ],
  feed: [
    {
      id: 1,
      time: "08:12",
      title: "Opposition message spike detected",
      source: "Ad monitoring",
      severity: "High",
      type: "warroom.threat_detected"
    },
    {
      id: 2,
      time: "09:05",
      title: "Education narrative gaining traction",
      source: "Media signal blend",
      severity: "Medium",
      type: "warroom.signal_detected"
    }
  ]
};

function toneClass(value) {
  return String(value).startsWith("-") ? "down" : "up";
}

function severityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

function incrementMetric(metrics, label, updater) {
  return (metrics || []).map((metric) => {
    if (metric.label !== label) return metric;
    return updater(metric);
  });
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

const CommandCenter = () => {
  const fetcher = useCallback(() => platformApi.commandCenter(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);
  const [liveBanner, setLiveBanner] = useState("");
  const [pulse, setPulse] = useState(false);

  useLiveChannel("intelligence:command-center", (event) => {
    if (!event?.type) return;

    if (event.type === "warroom.threat_detected") {
      const threat = event.payload || {};
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setLiveBanner(`Live threat fused into Command Center: ${threat.title || "Threat detected"}`);
      setPulse(true);

      setData((prev) => {
        const nextFeed = dedupeFeed([
          {
            id: `cc-threat-${Date.now()}`,
            time: now,
            title: threat.title || "Threat detected",
            source: threat.source || "War Room",
            severity: threat.severity || "High",
            type: "warroom.threat_detected"
          },
          ...(prev?.feed || [])
        ]).slice(0, 8);

        const nextActions = [
          {
            title: threat.recommendation || "Review live threat",
            owner: "War Room",
            due: "Now",
            detail: `Triggered by ${threat.source || "live threat feed"}.`
          },
          ...(prev?.actions || [])
        ].slice(0, 4);

        return {
          ...(prev || fallbackData),
          feed: nextFeed,
          actions: nextActions,
          metrics: incrementMetric(prev?.metrics || fallbackData.metrics, "Active Threats", (metric) => ({
            ...metric,
            value: String(Number(metric.value || 0) + 1),
            delta: "Live threat fused",
            tone: "down"
          }))
        };
      });
    }

    if (event.type === "warroom.signal_detected") {
      const signal = event.payload || {};
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setLiveBanner(`Live signal fused into Command Center: ${signal.channel || "Signal detected"}`);
      setPulse(true);

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

    if (event.type === "mail.delay_detected") {
      const mail = event.payload || {};
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setLiveBanner(`Live mail delay fused into Command Center: ${mail.location || "Mail issue detected"}`);
      setPulse(true);

      setData((prev) => ({
        ...(prev || fallbackData),
        feed: dedupeFeed([
          {
            id: `cc-mail-${Date.now()}`,
            time: now,
            title: `Mail delay detected at ${mail.location || "Unknown location"}`,
            source: "Mail Intelligence",
            severity: "High",
            type: "mail.delay_detected"
          },
          ...(prev?.feed || [])
        ]).slice(0, 8),
        metrics: incrementMetric(prev?.metrics || fallbackData.metrics, "Active Threats", (metric) => ({
          ...metric,
          value: String(Number(metric.value || 0) + 1),
          delta: "Mail disruption fused",
          tone: "down"
        }))
      }));
    }

    if (event.type === "forecast.updated") {
      const forecast = event.payload || {};

      setLiveBanner(
        `Live forecast fused into Command Center: ${forecast.state || "State"} ${forecast.office || "Race"}`
      );
      setPulse(true);

      setData((prev) => ({
        ...(prev || fallbackData),
        battlegrounds: [
          {
            race: `${forecast.state || "State"} ${forecast.office || "Race"}`,
            probability: `${forecast.winProbability ?? 50}%`,
            momentum: forecast.change || "+0.0",
            risk: "Watch",
            priority: "Tier 1"
          },
          ...(prev?.battlegrounds || [])
        ].slice(0, 6),
        feed: dedupeFeed([
          {
            id: `cc-forecast-${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            title: `Forecast updated for ${forecast.state || "State"} ${forecast.office || "Race"}`,
            source: "Forecast Engine",
            severity: "Medium",
            type: "forecast.updated"
          },
          ...(prev?.feed || [])
        ]).slice(0, 8)
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
      eyebrow="Executive Terminal"
      title="The operating system for campaign control, race velocity, and strategic response."
      description="Monitor battleground pressure, fundraising flow, narrative threats, and the next-best actions across the national map from one executive view."
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

      <Panel
        title="Priority Battleground Board"
        subtitle="Top races requiring executive monitoring and rapid adjustments"
        action="Open full map"
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Win Prob.</span>
              <span>Momentum</span>
              <span>Risk</span>
              <span>Priority</span>
            </div>

            {(data?.battlegrounds || []).map((row) => (
              <div key={`${row.race}-${row.priority}`} className="vs-table-row vs-table-row-five">
                <span>{row.race}</span>
                <span>{row.probability}</span>
                <span className={toneClass(row.momentum)}>{row.momentum}</span>
                <span>{row.risk}</span>
                <span>{row.priority}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="War Room Feed"
        subtitle="Live risk, logistics, and forecast signals entering the executive terminal"
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-warfeed">
            {(data?.feed || []).map((item) => (
              <div key={item.id || `${item.time}-${item.title}`} className="vs-warfeed-item">
                <div className="vs-warfeed-time">{item.time}</div>
                <div className={`vs-warfeed-severity ${severityTone(item.severity)}`}>
                  {item.severity}
                </div>
                <div className="vs-warfeed-content">
                  <div className="vs-warfeed-title">{item.title}</div>
                  <div className="vs-warfeed-source">
                    {item.source}
                    {item.type ? ` • ${item.type}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Executive Action Queue"
        subtitle="Highest-leverage next steps across live intelligence inputs"
        large
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-action-list">
            {(data?.actions || []).map((item, index) => (
              <div key={`${item.title}-${index}`} className="vs-action-item">
                <div className="vs-action-topline">
                  <div className="vs-action-title">{item.title}</div>
                  <div className="vs-action-due">{item.due}</div>
                </div>
                <div className="vs-action-owner">Owner: {item.owner}</div>
                <div className="vs-action-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default CommandCenter;
