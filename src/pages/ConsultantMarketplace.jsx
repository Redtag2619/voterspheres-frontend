import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "Top Rated Firms", value: "42", delta: "+6 this quarter", tone: "up" },
    { label: "Active Categories", value: "11", delta: "+2", tone: "up" },
    { label: "High-Demand Vendors", value: "18", delta: "+5", tone: "up" },
    { label: "Execution Risk Flags", value: "7", delta: "+1", tone: "down" }
  ],
  featured: [
    {
      name: "Red Tag Strategies",
      specialty: "Political mail recovery and postal campaign execution",
      score: "91.2",
      momentum: "+3.8",
      category: "Mail / Operations",
      note: "Strongest reliability profile for campaign mail tracking and support."
    },
    {
      name: "Summit Strategy Group",
      specialty: "Paid media and persuasion planning",
      score: "89.7",
      momentum: "+1.9",
      category: "Media",
      note: "High-performance placement and optimization."
    }
  ],
  board: [
    { firm: "Red Tag Strategies", category: "Mail Ops", score: "91.2", demand: "High", trend: "+3.8", status: "Leader" },
    { firm: "Blue Ridge Analytics", category: "Analytics", score: "88.4", demand: "Medium", trend: "+2.2", status: "Climbing" }
  ],
  guidance: [
    { title: "Best for execution reliability", detail: "Red Tag Strategies leads when the problem is mission-critical delivery." },
    { title: "Best for strategic modeling", detail: "Blue Ridge Analytics is best for forecasting and battleground analysis." }
  ]
};

function toneClass(v) {
  return String(v).startsWith("-") ? "down" : "up";
}

function scoreWidth(v) {
  return { width: `${v}%` };
}

const ConsultantMarketplace = () => {
  const fetcher = useCallback(() => api.marketplace(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Consultant Marketplace"
      title="The operating directory for political consultants, vendors, and execution partners."
      description="Evaluate firms by reliability, momentum, demand, and strategic fit across media, analytics, mail, field, and campaign operations."
      metrics={data?.metrics || []}
    >
      <Panel title="Featured Firms" subtitle="Highest-priority firms in the current campaign-services market">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-marketplace-featured-list">
            {data.featured.map((item) => (
              <div key={item.name} className="vs-marketplace-featured-item">
                <div className="vs-marketplace-featured-top">
                  <div>
                    <div className="vs-marketplace-featured-name">{item.name}</div>
                    <div className="vs-marketplace-featured-specialty">{item.specialty}</div>
                  </div>
                  <div className="vs-marketplace-featured-side">
                    <div className="vs-marketplace-featured-score">{item.score}</div>
                    <div className={toneClass(item.momentum)}>{item.momentum}</div>
                  </div>
                </div>
                <div className="vs-marketplace-featured-tags">
                  <span className="vs-marketplace-tag">{item.category}</span>
                </div>
                <div className="vs-marketplace-featured-bar">
                  <div className="vs-marketplace-featured-fill" style={scoreWidth(item.score)} />
                </div>
                <div className="vs-marketplace-featured-note">{item.note}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Vendor Market Board" subtitle="Comparative ranking across top consulting categories">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Firm</span>
              <span>Category</span>
              <span>Score</span>
              <span>Demand</span>
              <span>Trend</span>
              <span>Status</span>
            </div>
            {data.board.map((row) => (
              <div key={row.firm} className="vs-table-row vs-table-row-six">
                <span>{row.firm}</span>
                <span>{row.category}</span>
                <span>{row.score}</span>
                <span>{row.demand}</span>
                <span className={toneClass(row.trend)}>{row.trend}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Buyer Guidance" subtitle="Recommended consultant fits based on strategic need" large>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-marketplace-guidance-list">
            {data.guidance.map((item) => (
              <div key={item.title} className="vs-marketplace-guidance-item">
                <div className="vs-marketplace-guidance-title">{item.title}</div>
                <div className="vs-marketplace-guidance-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default ConsultantMarketplace;
