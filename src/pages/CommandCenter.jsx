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
  const fetcher = useCallback(() => api.commandCenter(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);
  const [liveBanner, setLiveBanner] = useState("");
  const demoMode = localStorage.getItem("vs_demo_mode") === "1";

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
            type: "warroom.threat_detected"
          },
          ...(prev?.feed || [])
        ]).slice(0, 8)
      }));
    }

    if (event.type === "warroom.signal_detected") {
      const signal = event.payload || {};
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setLiveBanner(`Live signal fused into Command Center: ${signal.channel || "Signal detected"}`);

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

  return (
    <TerminalPage
      eyebrow="Executive Terminal"
      title="The operating system for campaign control, race velocity, and strategic response."
      description="Monitor battleground pressure, fundraising flow, narrative threats, and the next-best actions across the national map from one executive view."
      metrics={data?.metrics || []}
    >
      {demoMode ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo campaign is live: battleground movement, threat pressure, and execution signals are simulated for presentation.
        </div>
      ) : null}

      {liveBanner ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
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
