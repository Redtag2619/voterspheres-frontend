import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const DEMO_KEY = "vs_demo_mode";
const DISMISSED_KEY = "vs_demo_onboarding_dismissed";

const steps = [
  {
    title: "Review the executive command layer",
    body: "Start with top battlegrounds, risk posture, and live campaign pressure."
  },
  {
    title: "Check candidate intelligence gaps",
    body: "Look for missing contacts, unverified profiles, stale intelligence, and Tier 1 priority candidates."
  },
  {
    title: "Scan alerts and operational signals",
    body: "Use the feed to see candidate, MailOps, vendor, and intelligence alerts in one place."
  },
  {
    title: "Move into execution",
    body: "Jump into Candidates, Vendors, MailOps, or Alerts to see how the platform turns signals into action."
  }
];

function isDemoEnabled() {
  try {
    return localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export function enableVoterSpheresDemo() {
  try {
    localStorage.setItem(DEMO_KEY, "1");
    localStorage.removeItem(DISMISSED_KEY);
  } catch {
    // ignore storage errors
  }
}

export function disableVoterSpheresDemo() {
  try {
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(DISMISSED_KEY);
  } catch {
    // ignore storage errors
  }
}

export default function DemoOnboarding({ compact = false }) {
  const [demoActive, setDemoActive] = useState(isDemoEnabled);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const sync = () => setDemoActive(isDemoEnabled());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const visible = demoActive && !dismissed;

  const quickLinks = useMemo(
    () => [
      { label: "Candidates", to: "/candidates" },
      { label: "Vendors", to: "/vendors" },
      { label: "MailOps", to: "/mailops" },
      { label: "Alerts", to: "/alerts" }
    ],
    []
  );

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  function endDemo() {
    disableVoterSpheresDemo();
    setDemoActive(false);
  }

  return (
    <section
      className="vs-card"
      style={{
        padding: compact ? "16px" : "20px",
        border: "1px solid rgba(37, 99, 235, 0.32)",
        background:
          "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(15,23,42,0.78))"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "14px",
          alignItems: "flex-start",
          flexWrap: "wrap"
        }}
      >
        <div>
          <div className="vs-page-eyebrow">Guided Demo Mode</div>
          <h2
            style={{
              margin: "8px 0 0",
              fontSize: compact ? "20px" : "24px",
              fontWeight: 900,
              letterSpacing: "-0.03em"
            }}
          >
            Welcome to the VoterSpheres command demo.
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              maxWidth: 760,
              color: "var(--vs-text-muted)",
              fontSize: "13px",
              lineHeight: 1.7
            }}
          >
            This guided view shows how consultants can identify campaign risk,
            candidate intelligence gaps, operational pressure, and next-best actions
            from one command surface.
          </p>
        </div>

        <div className="vs-inline-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={dismiss}>
            Hide Guide
          </button>
          <button type="button" className="vs-button vs-button-secondary" onClick={endDemo}>
            End Demo
          </button>
        </div>
      </div>

      <div className="vs-grid-4" style={{ marginTop: 16 }}>
        {steps.map((step, index) => (
          <div key={step.title} className="vs-card-muted" style={{ padding: 14 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: "rgba(37,99,235,0.18)",
                color: "var(--vs-text)",
                fontWeight: 900,
                fontSize: 13
              }}
            >
              {index + 1}
            </div>

            <div style={{ marginTop: 10, fontWeight: 850, color: "var(--vs-text)" }}>
              {step.title}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                lineHeight: 1.6,
                color: "var(--vs-text-muted)"
              }}
            >
              {step.body}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <span style={{ fontSize: 12, color: "var(--vs-text-muted)", fontWeight: 700 }}>
          Continue demo:
        </span>

        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to} className="vs-button vs-button-secondary">
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
