import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "Top Rated Campaign", value: "Garcia Senate", delta: "+2.4", tone: "up" },
    { label: "Fastest Climber", value: "Rivers MI-07", delta: "+5 spots", tone: "up" },
    { label: "Highest Risk Drop", value: "Cole PA-08", delta: "-4 spots", tone: "down" },
    { label: "Consultant Leader", value: "Red Tag Strategies", delta: "91.2 score", tone: "neutral" }
  ],
  campaigns: [
    { rank: 1, name: "Garcia Senate", score: 94.8, movement: "+2", category: "Senate", signal: "Fundraising + message discipline" },
    { rank: 2, name: "Coleman for Georgia", score: 92.7, movement: "+1", category: "Senate", signal: "Turnout + media advantage" }
  ],
  consultants: [
    { rank: 1, firm: "Red Tag Strategies", specialty: "Political mail recovery", score: 91.2, trend: "+3.8" },
    { rank: 2, firm: "Summit Strategy Group", specialty: "Paid media", score: 89.7, trend: "+1.9" }
  ],
  notes: [
    { title: "Most undervalued category", detail: "Mail and operations support is often underbought relative to final-cycle impact." },
    { title: "Highest-demand consultant stack", detail: "Analytics + media + mail execution is the strongest operating mix." }
  ]
};

function toneClass(v) {
  const s = String(v);
  if (s.startsWith("-")) return "down";
  if (s.startsWith("+")) return "up";
  return "neutral";
}

function scoreWidth(v) {
  return { width: `${v}%` };
}

const PowerRankings = () => {
  const fetcher = useCallback(() => api.rankings(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Power Rankings"
      title="The leaderboard for campaigns, consultants, and donor networks shaping the political market."
      description="VoterSpheres ranks the strongest operators and campaigns by fundraising strength, message performance, momentum, resilience, and strategic execution."
      metrics={data?.metrics || []}
    >
      <Panel title="Campaign Leaderboard" subtitle="Top campaigns ranked by total strategic strength">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-ranking-list">
            {data.campaigns.map((item) => (
              <div key={item.name} className="vs-ranking-item">
                <div className="vs-ranking-topline">
                  <div className="vs-ranking-left">
                    <div className="vs-ranking-badge">#{item.rank}</div>
                    <div>
                      <div className="vs-ranking-name">{item.name}</div>
                      <div className="vs-ranking-sub">{item.category}</div>
                    </div>
                  </div>
                  <div className="vs-ranking-right">
                    <div className="vs-ranking-score">{item.score}</div>
                    <div className={toneClass(item.movement)}>{item.movement}</div>
                  </div>
                </div>
                <div className="vs-ranking-bar">
                  <div className="vs-ranking-fill" style={scoreWidth(item.score)} />
                </div>
                <div className="vs-ranking-signal">{item.signal}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Consultant Rankings" subtitle="Firms winning on delivery, reliability, and cycle impact">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Rank</span>
              <span>Firm</span>
              <span>Specialty</span>
              <span>Score</span>
              <span>Trend</span>
            </div>
            {data.consultants.map((row) => (
              <div key={row.firm} className="vs-table-row vs-table-row-five">
                <span>#{row.rank}</span>
                <span>{row.firm}</span>
                <span>{row.specialty}</span>
                <span>{row.score}</span>
                <span className={toneClass(row.trend)}>{row.trend}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="AI Marketplace Notes" subtitle="Machine-assisted read on vendor strategy and market shape" large>
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

export default PowerRankings;
