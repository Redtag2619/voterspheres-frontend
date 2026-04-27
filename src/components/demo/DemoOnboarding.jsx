import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const DEMO_KEY = "vs_demo_mode";
const DISMISSED_KEY = "vs_demo_onboarding_dismissed";

const steps = [
  {
    label: "Step 1",
    title: "Start in Command Center",
    body: "Review the executive view: campaign pressure, candidate intelligence, vendor risk, MailOps posture, and active alerts.",
    cta: "You are here",
    to: "/command-center"
  },
  {
    label: "Step 2",
    title: "Inspect Candidate Intelligence",
    body: "Open Candidates to review Tier 1 records, missing contacts, verification status, and profile enrichment.",
    cta: "Open Candidates",
    to: "/candidates"
  },
  {
    label: "Step 3",
    title: "Scan Vendor Risk",
    body: "Review vendor scoring, coverage gaps, operational risk, and dispatch alerts for execution issues.",
    cta: "Open Vendors",
    to: "/vendors"
  },
  {
    label: "Step 4",
    title: "Review Alerts",
    body: "Use the alert terminal to see candidate, vendor, MailOps, and cross-signal warnings in one place.",
    cta: "Open Alerts",
    to: "/alerts"
  }
];

function endDemo() {
  localStorage.removeItem(DEMO_KEY);
  localStorage.removeItem(DISMISSED_KEY);
  window.location.reload();
}

export default function DemoOnboarding() {
  const [activeStep, setActiveStep] = useState(0);
  const [hidden, setHidden] = useState(
    localStorage.getItem(DISMISSED_KEY) === "1"
  );

  const demoMode = localStorage.getItem(DEMO_KEY) === "1";
  const step = steps[activeStep];

  const progress = useMemo(
    () => Math.round(((activeStep + 1) / steps.length) * 100),
    [activeStep]
  );

  if (!demoMode || hidden) return null;

  function hideGuide() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setHidden(true);
  }

  return (
    <section
      className="vs-card"
      style={{
        padding: 20,
        border: "1px solid rgba(37, 99, 235, 0.35)",
        background:
          "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(15,23,42,0.88))",
        boxShadow: "0 18px 50px rgba(2,6,23,0.32)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start"
        }}
      >
        <div>
          <div className="vs-page-eyebrow">Guided Demo Walkthrough</div>
          <h2
            style={{
              margin: "8px 0 0",
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "-0.035em"
            }}
          >
            See how VoterSpheres runs a political operation.
          </h2>
          <p
            style={{
              marginTop: 8,
              maxWidth: 760,
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--vs-text-muted)"
            }}
          >
            Follow the walkthrough to experience the command layer, candidate
            intelligence, vendor risk, and alert engine.
          </p>
        </div>

        <div className="vs-inline-actions">
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={hideGuide}
          >
            Hide Guide
          </button>
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={endDemo}
          >
            End Demo
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          height: 8,
          borderRadius: 999,
          background: "rgba(148,163,184,0.18)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #2563eb, #22d3ee)",
            transition: "width 220ms ease"
          }}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)",
          gap: 16
        }}
      >
        <div className="vs-stack">
          {steps.map((item, index) => {
            const active = index === activeStep;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveStep(index)}
                className="vs-card-muted"
                style={{
                  padding: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  border: active
                    ? "1px solid rgba(37,99,235,0.55)"
                    : "1px solid rgba(148,163,184,0.14)",
                  boxShadow: active
                    ? "0 0 0 1px rgba(37,99,235,0.18)"
                    : "none"
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: active ? "#93c5fd" : "var(--vs-text-muted)",
                    fontWeight: 900
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    fontWeight: 850,
                    color: "var(--vs-text)"
                  }}
                >
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="vs-card-muted"
          style={{
            padding: 18,
            display: "grid",
            alignContent: "space-between",
            minHeight: 260
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                borderRadius: 999,
                padding: "6px 10px",
                background: "rgba(37,99,235,0.16)",
                color: "#bfdbfe",
                fontSize: 12,
                fontWeight: 850
              }}
            >
              {step.label}
            </div>

            <h3
              style={{
                margin: "14px 0 0",
                fontSize: 26,
                lineHeight: 1.05,
                fontWeight: 950,
                letterSpacing: "-0.04em",
                color: "var(--vs-text)"
              }}
            >
              {step.title}
            </h3>

            <p
              style={{
                marginTop: 10,
                color: "var(--vs-text-muted)",
                fontSize: 14,
                lineHeight: 1.7
              }}
            >
              {step.body}
            </p>

            <div className="vs-grid-3" style={{ marginTop: 16 }}>
              <MiniMetric label="Signals" value="Live" />
              <MiniMetric label="Risk" value="Scored" />
              <MiniMetric label="Actions" value="Guided" />
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="vs-button vs-button-secondary"
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
              >
                Previous
              </button>

              <button
                type="button"
                className="vs-button"
                onClick={() =>
                  setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))
                }
                disabled={activeStep === steps.length - 1}
              >
                Next Step
              </button>
            </div>

            <Link to={step.to} className="vs-button vs-button-primary">
              {step.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="vs-card" style={{ padding: 12 }}>
      <div className="vs-stat-label">{label}</div>
      <div style={{ marginTop: 6, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
