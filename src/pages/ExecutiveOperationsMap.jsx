import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * ExecutiveOperationsMap.jsx
 * Full replacement component for VoterSpheres.
 *
 * Design goals:
 * - No external chart/map libraries required.
 * - Safe if backend data is missing or still being wired.
 * - Premium executive command-center feel.
 * - Includes state filtering, priority lanes, vendor gaps, and action routing.
 *
 * Expected route:
 *   /executive-operations-map
 *
 * Optional query support can be added later, but this file is intentionally
 * self-contained to avoid deployment/runtime errors.
 */

const BATTLEGROUND_STATES = [
  {
    code: "PA",
    name: "Pennsylvania",
    region: "Mid-Atlantic",
    priority: "Tier 1",
    risk: "Elevated",
    momentum: "+1.8",
    winProbability: 54,
    races: ["Senate", "Presidential", "House PA-07", "House PA-08"],
    signals: [
      "Suburban persuasion universe needs daily message pressure.",
      "Mail vendor coverage is thin in eastern counties.",
      "Newswire monitoring flagged budget pressure in Tier 1 markets.",
    ],
    vendorGap: "Direct mail + ballot chase capacity",
    nextMove: "Push PA vendor task package into Command Center.",
  },
  {
    code: "GA",
    name: "Georgia",
    region: "Southeast",
    priority: "Tier 1",
    risk: "Elevated",
    momentum: "+2.4",
    winProbability: 57,
    races: ["Senate", "Presidential", "House GA-02"],
    signals: [
      "Metro turnout modeling has moved into high-watch status.",
      "Vendor coverage is available but needs redundancy.",
      "Fundraising pace is strong, but field timing is compressed.",
    ],
    vendorGap: "Field ops redundancy",
    nextMove: "Audit metro Atlanta field/vendor overlap.",
  },
  {
    code: "AZ",
    name: "Arizona",
    region: "Southwest",
    priority: "Tier 2",
    risk: "Watch",
    momentum: "+1.1",
    winProbability: 51,
    races: ["Senate", "Presidential", "House AZ-01", "House AZ-06"],
    signals: [
      "Early vote operation requires tighter county-level tracking.",
      "Latino persuasion universe should be refreshed weekly.",
      "Consultant capacity is adequate but not deep.",
    ],
    vendorGap: "Early vote analytics support",
    nextMove: "Prepare AZ early vote tracking workstream.",
  },
  {
    code: "NV",
    name: "Nevada",
    region: "Southwest",
    priority: "Tier 2",
    risk: "Watch",
    momentum: "+0.9",
    winProbability: 50,
    races: ["Senate", "Presidential", "House NV-03"],
    signals: [
      "Labor and hospitality turnout lanes need close coordination.",
      "Paid media and mail timing should be reviewed together.",
      "Operational risk rises if vendor confirmation slips.",
    ],
    vendorGap: "Mail production confirmation",
    nextMove: "Confirm mail calendar and production reserve.",
  },
  {
    code: "MI",
    name: "Michigan",
    region: "Great Lakes",
    priority: "Tier 1",
    risk: "Elevated",
    momentum: "+1.5",
    winProbability: 53,
    races: ["Senate", "Presidential", "House MI-07", "House MI-10"],
    signals: [
      "Blue-collar persuasion universe is movement-sensitive.",
      "Digital contrast messaging should align with field cadence.",
      "County-level volunteer gaps remain a watch item.",
    ],
    vendorGap: "Field + digital coordination",
    nextMove: "Sync field calendar with paid/digital plan.",
  },
  {
    code: "WI",
    name: "Wisconsin",
    region: "Great Lakes",
    priority: "Tier 1",
    risk: "High Watch",
    momentum: "+0.7",
    winProbability: 49,
    races: ["Senate", "Presidential", "House WI-03"],
    signals: [
      "Margins remain narrow across rural and suburban lanes.",
      "Relational organizing needs more execution visibility.",
      "Vendor capacity is present but not fully assigned.",
    ],
    vendorGap: "Relational organizing support",
    nextMove: "Create WI relational organizing execution task.",
  },
  {
    code: "NC",
    name: "North Carolina",
    region: "Southeast",
    priority: "Tier 2",
    risk: "Watch",
    momentum: "+1.0",
    winProbability: 50,
    races: ["Governor", "Presidential", "House NC-01"],
    signals: [
      "Statewide race stack creates turnout upside.",
      "Rural persuasion should be watched with mail and phones.",
      "Candidate visibility is improving in key media markets.",
    ],
    vendorGap: "Rural persuasion mail",
    nextMove: "Build rural persuasion vendor shortlist.",
  },
];

const SUMMARY_CARDS = [
  {
    label: "Tier 1 States",
    value: "4",
    note: "Highest executive priority",
  },
  {
    label: "Active Signals",
    value: "21",
    note: "Across battleground map",
  },
  {
    label: "Vendor Gaps",
    value: "7",
    note: "Needs task coverage",
  },
  {
    label: "Avg Win Prob.",
    value: "52%",
    note: "Modeled operating view",
  },
];

const FILTERS = ["All", "Tier 1", "Tier 2", "Elevated", "Watch"];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getRiskClass(risk) {
  const normalized = String(risk || "").toLowerCase();

  if (normalized.includes("high")) return "vs-risk-high";
  if (normalized.includes("elevated")) return "vs-risk-elevated";
  if (normalized.includes("watch")) return "vs-risk-watch";

  return "vs-risk-default";
}

function clampPercent(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function ExecutiveOperationsMap() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedStateCode, setSelectedStateCode] = useState("PA");

  const filteredStates = useMemo(() => {
    return BATTLEGROUND_STATES.filter((state) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Tier 1" || activeFilter === "Tier 2") {
        return state.priority === activeFilter;
      }
      return String(state.risk).toLowerCase().includes(activeFilter.toLowerCase());
    });
  }, [activeFilter]);

  const selectedState = useMemo(() => {
    return (
      BATTLEGROUND_STATES.find((state) => state.code === selectedStateCode) ||
      BATTLEGROUND_STATES[0]
    );
  }, [selectedStateCode]);

  const tierOneStates = useMemo(
    () => BATTLEGROUND_STATES.filter((state) => state.priority === "Tier 1"),
    []
  );

  const handleOpenCommandCenter = (stateCode) => {
    navigate(`/command-center?state=${encodeURIComponent(stateCode)}&source=operations-map`);
  };

  const handleOpenVendors = (stateCode) => {
    navigate(`/vendors?state=${encodeURIComponent(stateCode)}&source=operations-map`);
  };

  return (
    <main className="vs-ops-page">
      <style>{styles}</style>

      <section className="vs-ops-hero">
        <div>
          <p className="vs-kicker">Executive Operations Map</p>
          <h1>Live battleground execution view</h1>
          <p className="vs-hero-copy">
            Track priority states, risk movement, vendor gaps, and next operational moves from one executive map layer.
          </p>
        </div>

        <div className="vs-hero-actions">
          <Link className="vs-btn vs-btn-secondary" to="/dashboard">
            Back to Dashboard
          </Link>
          <Link className="vs-btn vs-btn-primary" to="/command-center">
            Open Command Center
          </Link>
        </div>
      </section>

      <section className="vs-summary-grid" aria-label="Executive operations summary">
        {SUMMARY_CARDS.map((card) => (
          <article className="vs-summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </article>
        ))}
      </section>

      <section className="vs-filter-bar" aria-label="Operations filters">
        {FILTERS.map((filter) => (
          <button
            type="button"
            key={filter}
            className={cx("vs-filter-chip", activeFilter === filter && "is-active")}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </section>

      <section className="vs-ops-layout">
        <div className="vs-map-panel">
          <div className="vs-panel-heading">
            <div>
              <p className="vs-kicker">Priority Map</p>
              <h2>State execution pressure</h2>
            </div>
            <span className="vs-live-pill">Live view</span>
          </div>

          <div className="vs-state-grid">
            {filteredStates.map((state) => {
              const selected = selectedState.code === state.code;
              return (
                <button
                  type="button"
                  key={state.code}
                  className={cx("vs-state-tile", selected && "is-selected")}
                  onClick={() => setSelectedStateCode(state.code)}
                >
                  <div className="vs-state-topline">
                    <strong>{state.code}</strong>
                    <span className={cx("vs-risk-pill", getRiskClass(state.risk))}>{state.risk}</span>
                  </div>
                  <span className="vs-state-name">{state.name}</span>
                  <div className="vs-meter" aria-hidden="true">
                    <span style={{ width: `${clampPercent(state.winProbability)}%` }} />
                  </div>
                  <div className="vs-state-meta">
                    <span>{state.priority}</span>
                    <span>{state.winProbability}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="vs-detail-panel" aria-label="Selected state details">
          <div className="vs-detail-header">
            <div>
              <p className="vs-kicker">Selected State</p>
              <h2>
                {selectedState.name} <span>{selectedState.code}</span>
              </h2>
            </div>
            <span className={cx("vs-risk-pill", getRiskClass(selectedState.risk))}>{selectedState.risk}</span>
          </div>

          <div className="vs-detail-stats">
            <div>
              <span>Priority</span>
              <strong>{selectedState.priority}</strong>
            </div>
            <div>
              <span>Momentum</span>
              <strong>{selectedState.momentum}</strong>
            </div>
            <div>
              <span>Win Prob.</span>
              <strong>{selectedState.winProbability}%</strong>
            </div>
          </div>

          <div className="vs-section-block">
            <h3>Tracked races</h3>
            <div className="vs-race-list">
              {selectedState.races.map((race) => (
                <span key={race}>{race}</span>
              ))}
            </div>
          </div>

          <div className="vs-section-block">
            <h3>Cross-signal priority layer</h3>
            <ul className="vs-signal-list">
              {selectedState.signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>

          <div className="vs-gap-card">
            <span>Vendor gap</span>
            <strong>{selectedState.vendorGap}</strong>
            <p>{selectedState.nextMove}</p>
          </div>

          <div className="vs-detail-actions">
            <button
              type="button"
              className="vs-btn vs-btn-primary"
              onClick={() => handleOpenCommandCenter(selectedState.code)}
            >
              Create Command Task
            </button>
            <button
              type="button"
              className="vs-btn vs-btn-secondary"
              onClick={() => handleOpenVendors(selectedState.code)}
            >
              Find Vendors
            </button>
          </div>
        </aside>
      </section>

      <section className="vs-lanes-grid">
        <article className="vs-lane-card">
          <div className="vs-panel-heading compact">
            <div>
              <p className="vs-kicker">Tier 1 Lane</p>
              <h2>Executive attention queue</h2>
            </div>
          </div>

          <div className="vs-queue-list">
            {tierOneStates.map((state) => (
              <button
                type="button"
                key={state.code}
                className="vs-queue-item"
                onClick={() => setSelectedStateCode(state.code)}
              >
                <span className="vs-queue-code">{state.code}</span>
                <span className="vs-queue-body">
                  <strong>{state.name}</strong>
                  <small>{state.nextMove}</small>
                </span>
                <span className={cx("vs-risk-dot", getRiskClass(state.risk))} />
              </button>
            ))}
          </div>
        </article>

        <article className="vs-lane-card">
          <div className="vs-panel-heading compact">
            <div>
              <p className="vs-kicker">Operations Notes</p>
              <h2>How to use this view</h2>
            </div>
          </div>

          <div className="vs-note-stack">
            <p>
              Use the map to decide where executive attention, vendor coverage, and Command Center tasks should go next.
            </p>
            <p>
              The buttons route with a state query parameter so your Command Center and Vendor Network pages can auto-filter by state.
            </p>
            <p>
              This replacement is intentionally frontend-safe and can later be wired to live API data without changing the page structure.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}

const styles = `
.vs-ops-page {
  min-height: 100vh;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(32, 82, 190, 0.24), transparent 34%),
    linear-gradient(135deg, #07111f 0%, #0c1728 48%, #101827 100%);
  color: #f8fafc;
}

.vs-ops-hero,
.vs-map-panel,
.vs-detail-panel,
.vs-lane-card,
.vs-summary-card,
.vs-filter-bar {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
}

.vs-ops-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  border-radius: 28px;
  padding: 30px;
  margin-bottom: 20px;
}

.vs-kicker {
  margin: 0 0 8px;
  color: #93c5fd;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 800;
}

.vs-ops-hero h1,
.vs-panel-heading h2,
.vs-detail-header h2,
.vs-lane-card h2 {
  margin: 0;
  line-height: 1.08;
}

.vs-ops-hero h1 {
  font-size: clamp(30px, 5vw, 56px);
  letter-spacing: -0.05em;
}

.vs-hero-copy {
  max-width: 760px;
  margin: 14px 0 0;
  color: #cbd5e1;
  font-size: 16px;
  line-height: 1.7;
}

.vs-hero-actions,
.vs-detail-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.vs-btn {
  border: 0;
  border-radius: 999px;
  padding: 12px 16px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  white-space: nowrap;
}

.vs-btn:hover {
  transform: translateY(-1px);
}

.vs-btn-primary {
  color: #06111f;
  background: linear-gradient(135deg, #bfdbfe, #60a5fa);
}

.vs-btn-secondary {
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.32);
}

.vs-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.vs-summary-card {
  border-radius: 22px;
  padding: 18px;
}

.vs-summary-card span,
.vs-detail-stats span,
.vs-gap-card span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.vs-summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 30px;
  letter-spacing: -0.04em;
}

.vs-summary-card small {
  display: block;
  margin-top: 4px;
  color: #cbd5e1;
}

.vs-filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  border-radius: 20px;
  padding: 12px;
  margin-bottom: 16px;
}

.vs-filter-chip {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 999px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.76);
  color: #cbd5e1;
  font-weight: 800;
  cursor: pointer;
}

.vs-filter-chip.is-active {
  color: #06111f;
  background: #bfdbfe;
  border-color: #bfdbfe;
}

.vs-ops-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(340px, 0.75fr);
  gap: 16px;
}

.vs-map-panel,
.vs-detail-panel,
.vs-lane-card {
  border-radius: 28px;
  padding: 22px;
}

.vs-panel-heading,
.vs-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.vs-panel-heading.compact {
  margin-bottom: 14px;
}

.vs-live-pill,
.vs-risk-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.vs-live-pill {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.13);
  border: 1px solid rgba(34, 197, 94, 0.28);
}

.vs-state-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.vs-state-tile {
  min-height: 168px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  padding: 16px;
  color: #f8fafc;
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.86), rgba(15, 23, 42, 0.92));
  text-align: left;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.vs-state-tile:hover,
.vs-state-tile.is-selected {
  transform: translateY(-2px);
  border-color: rgba(147, 197, 253, 0.72);
  background: linear-gradient(180deg, rgba(30, 64, 175, 0.44), rgba(15, 23, 42, 0.94));
}

.vs-state-topline,
.vs-state-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.vs-state-topline strong {
  font-size: 30px;
  letter-spacing: -0.05em;
}

.vs-state-name {
  display: block;
  margin-top: 8px;
  color: #cbd5e1;
  font-weight: 800;
}

.vs-meter {
  height: 8px;
  margin: 22px 0 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.vs-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #60a5fa, #bfdbfe);
}

.vs-state-meta {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 900;
}

.vs-risk-high {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.24);
}

.vs-risk-elevated {
  color: #fed7aa;
  background: rgba(249, 115, 22, 0.16);
  border: 1px solid rgba(249, 115, 22, 0.28);
}

.vs-risk-watch {
  color: #fde68a;
  background: rgba(234, 179, 8, 0.14);
  border: 1px solid rgba(234, 179, 8, 0.26);
}

.vs-risk-default {
  color: #cbd5e1;
  background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.vs-detail-header h2 span {
  color: #93c5fd;
}

.vs-detail-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.vs-detail-stats div {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.62);
}

.vs-detail-stats strong {
  display: block;
  margin-top: 6px;
  font-size: 20px;
}

.vs-section-block {
  margin-top: 18px;
}

.vs-section-block h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.vs-race-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.vs-race-list span {
  border-radius: 999px;
  padding: 8px 10px;
  color: #dbeafe;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.22);
  font-size: 13px;
  font-weight: 800;
}

.vs-signal-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vs-signal-list li {
  position: relative;
  padding: 12px 12px 12px 34px;
  border-radius: 16px;
  color: #dbeafe;
  background: rgba(30, 41, 59, 0.58);
  border: 1px solid rgba(148, 163, 184, 0.16);
  line-height: 1.5;
}

.vs-signal-list li::before {
  content: "";
  position: absolute;
  left: 14px;
  top: 19px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #60a5fa;
}

.vs-gap-card {
  margin-top: 18px;
  border-radius: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.35), rgba(15, 23, 42, 0.78));
  border: 1px solid rgba(147, 197, 253, 0.24);
}

.vs-gap-card strong {
  display: block;
  margin-top: 6px;
  font-size: 18px;
}

.vs-gap-card p {
  margin: 8px 0 0;
  color: #cbd5e1;
  line-height: 1.55;
}

.vs-detail-actions {
  margin-top: 18px;
}

.vs-lanes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.vs-queue-list,
.vs-note-stack {
  display: grid;
  gap: 10px;
}

.vs-queue-item {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  padding: 12px;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.6);
  text-align: left;
  cursor: pointer;
}

.vs-queue-code {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(96, 165, 250, 0.16);
  color: #bfdbfe;
  font-weight: 950;
}

.vs-queue-body strong,
.vs-queue-body small {
  display: block;
}

.vs-queue-body small {
  margin-top: 3px;
  color: #94a3b8;
  line-height: 1.45;
}

.vs-risk-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.vs-note-stack p {
  margin: 0;
  padding: 14px;
  border-radius: 18px;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.58);
  border: 1px solid rgba(148, 163, 184, 0.14);
  line-height: 1.65;
}

@media (max-width: 1120px) {
  .vs-ops-layout,
  .vs-lanes-grid {
    grid-template-columns: 1fr;
  }

  .vs-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 780px) {
  .vs-ops-page {
    padding: 18px;
  }

  .vs-ops-hero {
    flex-direction: column;
    border-radius: 22px;
    padding: 22px;
  }

  .vs-state-grid,
  .vs-detail-stats,
  .vs-summary-grid {
    grid-template-columns: 1fr;
  }

  .vs-hero-actions,
  .vs-detail-actions {
    width: 100%;
  }

  .vs-btn {
    width: 100%;
    text-align: center;
  }
}
`;

export default ExecutiveOperationsMap;

