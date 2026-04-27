import { useEffect, useMemo, useState } from "react";
import Badge from "../ui/Badge";

const DEMO_KEY = "vs_demo_mode";

const demoSignals = [
  {
    title: "Candidate contact gap flagged",
    source: "Candidate Intelligence",
    severity: "Medium",
    state: "PA",
    office: "Senate",
    risk: "Watch"
  },
  {
    title: "Vendor coverage spike detected",
    source: "Vendor Intelligence",
    severity: "High",
    state: "AZ",
    office: "Senate",
    risk: "Elevated"
  },
  {
    title: "MailOps delivery window tightened",
    source: "MailOps",
    severity: "High",
    state: "GA",
    office: "Senate",
    risk: "Elevated"
  },
  {
    title: "Battleground priority score updated",
    source: "Cross-Signal Engine",
    severity: "Medium",
    state: "PA",
    office: "Senate",
    risk: "Watch"
  }
];

function toneFromSeverity(severity) {
  const value = String(severity || "").toLowerCase();
  if (value === "high" || value === "critical") return "danger";
  if (value === "medium" || value === "watch") return "warning";
  return "default";
}

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function LiveActivityStream({ onSignal }) {
  const [signals, setSignals] = useState(() =>
    demoSignals.slice(0, 2).map((item, index) => ({
      ...item,
      id: `demo-live-${index}`,
      time: nowTime()
    }))
  );

  const demoMode = useMemo(() => {
    try {
      return localStorage.getItem(DEMO_KEY) === "1";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!demoMode) return undefined;

    const timer = setInterval(() => {
      const signal = demoSignals[Math.floor(Math.random() * demoSignals.length)];
      const next = {
        ...signal,
        id: `demo-live-${Date.now()}`,
        time: nowTime()
      };

      setSignals((prev) => [next, ...prev].slice(0, 6));
      onSignal?.(next);
    }, 7000);

    return () => clearInterval(timer);
  }, [demoMode, onSignal]);

  if (!demoMode) return null;

  return (
    <section
      className="vs-card"
      style={{
        padding: 18,
        border: "1px solid rgba(34, 211, 238, 0.28)",
        background:
          "linear-gradient(135deg, rgba(34,211,238,0.10), rgba(15,23,42,0.78))"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div>
          <div className="vs-page-eyebrow">Live Demo Stream</div>
          <h3
            style={{
              margin: "6px 0 0",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "-0.03em"
            }}
          >
            Intelligence signals are moving in real time.
          </h3>
        </div>

        <Badge tone="active">Live Simulation</Badge>
      </div>

      <div className="vs-stack" style={{ marginTop: 14 }}>
        {signals.map((item, index) => (
          <div
            key={item.id}
            className="vs-card-muted"
            style={{
              padding: 14,
              display: "grid",
              gap: 8,
              border:
                index === 0
                  ? "1px solid rgba(34,211,238,0.35)"
                  : "1px solid rgba(148,163,184,0.14)",
              animation: index === 0 ? "vsPulseIn 700ms ease both" : undefined
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap"
              }}
            >
              <div style={{ fontWeight: 850 }}>{item.title}</div>
              <Badge tone={toneFromSeverity(item.severity)}>{item.severity}</Badge>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--vs-text-muted)",
                display: "flex",
                gap: 10,
                flexWrap: "wrap"
              }}
            >
              <span>{item.time}</span>
              <span>{item.source}</span>
              <span>{item.state} • {item.office}</span>
              <span>{item.risk}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
