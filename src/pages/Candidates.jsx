import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "Tracked Candidates", value: "248", delta: "+14 this week", tone: "up" },
    { label: "High-Risk Profiles", value: "19", delta: "+3", tone: "down" },
    { label: "Momentum Leaders", value: "27", delta: "+6", tone: "up" },
    { label: "Persuasion Targets", value: "41", delta: "+5", tone: "up" }
  ],
  featured: [
    {
      name: "Elena Garcia",
      office: "U.S. Senate / Pennsylvania",
      party: "Democratic",
      rating: "94.8",
      momentum: "+2.4",
      cash: "$19.2M",
      narrative: "Strong affordability frame and high fundraising efficiency."
    },
    {
      name: "Tara Mitchell",
      office: "U.S. House / AZ-01",
      party: "Independent",
      rating: "89.4",
      momentum: "+3.1",
      cash: "$8.9M",
      narrative: "Best persuasion gains in suburban women 35–54 segment."
    }
  ],
  board: [
    { name: "Elena Garcia", district: "PA Senate", party: "D", favorability: "52", funds: "$19.2M", momentum: "+2.4", status: "Leader" },
    { name: "Marcus Coleman", district: "GA Senate", party: "R", favorability: "50", funds: "$17.8M", momentum: "+1.8", status: "Leader" }
  ],
  notes: [
    { title: "Most resilient candidate profile", detail: "Garcia combines finance strength, issue ownership, and low narrative risk." },
    { title: "Highest upside challenger", detail: "Mitchell has the strongest probability of late-cycle acceleration." }
  ]
};

function toneClass(v) {
  return String(v).startsWith("-") ? "down" : "up";
}

function ratingWidth(v) {
  return { width: `${v}%` };
}

const Candidates = () => {
  const fetcher = useCallback(() => api.candidates(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Candidate Intelligence"
      title="The live directory for candidate strength, vulnerability, money, message, and movement."
      description="Monitor top candidate profiles across competitive races with strategist-grade signals on fundraising, narrative control, favorability, and path-to-win potential."
      metrics={data?.metrics || []}
    >
      <Panel title="Featured Candidate Profiles" subtitle="Highest-priority profiles in the current cycle">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-featured-candidate-list">
            {data.featured.map((item) => (
              <div key={item.name} className="vs-featured-candidate-item">
                <div className="vs-featured-candidate-top">
                  <div>
                    <div className="vs-featured-candidate-name">{item.name}</div>
                    <div className="vs-featured-candidate-office">{item.office}</div>
                  </div>
                  <div className="vs-featured-candidate-badges">
                    <span className="vs-featured-party">{item.party}</span>
                  </div>
                </div>

                <div className="vs-featured-candidate-metrics">
                  <div>
                    <div className="vs-featured-metric-label">Rating</div>
                    <div className="vs-featured-metric-value">{item.rating}</div>
                  </div>
                  <div>
                    <div className="vs-featured-metric-label">Momentum</div>
                    <div className={`vs-featured-metric-value ${toneClass(item.momentum)}`}>{item.momentum}</div>
                  </div>
                  <div>
                    <div className="vs-featured-metric-label">Cash</div>
                    <div className="vs-featured-metric-value">{item.cash}</div>
                  </div>
                </div>

                <div className="vs-featured-candidate-bar">
                  <div className="vs-featured-candidate-fill" style={ratingWidth(item.rating)} />
                </div>
                <div className="vs-featured-candidate-note">{item.narrative}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Candidate Market Board" subtitle="Core metrics across priority campaigns">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Name</span>
              <span>Race</span>
              <span>Party</span>
              <span>Fav.</span>
              <span>Funds</span>
              <span>Momentum</span>
              <span>Status</span>
            </div>
            {data.board.map((row) => (
              <div key={`${row.name}-${row.district}`} className="vs-table-row vs-table-row-seven">
                <span>{row.name}</span>
                <span>{row.district}</span>
                <span>{row.party}</span>
                <span>{row.favorability}</span>
                <span>{row.funds}</span>
                <span className={toneClass(row.momentum)}>{row.momentum}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="AI Candidate Notes" subtitle="Machine-assisted read on profile quality and risk" large>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-ai-note-list">
            {data.notes.map((item) => (
              <div key={item.title} className="vs-ai-note-item">
                <div className="vs-ai-note-title">{item.title}</div>
                <div className="vs-ai-note-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default Candidates;
