import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "24h Raised", value: "$12.6M", delta: "+11.2%", tone: "up" },
    { label: "Small-Dollar Share", value: "38%", delta: "+4.1", tone: "up" },
    { label: "Bundler Confidence", value: "81", delta: "-2.0", tone: "down" },
    { label: "Burn Efficiency", value: "7.8", delta: "+0.9", tone: "up" }
  ],
  channels: [
    { channel: "Digital Small-Dollar", amount: "$3.8M", change: "+18%", mix: "30%" },
    { channel: "National Finance Chairs", amount: "$2.9M", change: "+9%", mix: "23%" }
  ],
  board: [
    { name: "Garcia Senate", raised: "$8.4M", cash: "$19.2M", burn: "0.42", trend: "+12%" },
    { name: "Coleman for Georgia", raised: "$7.7M", cash: "$17.8M", burn: "0.45", trend: "+9%" }
  ],
  actions: [
    {
      title: "Launch bundler reassurance brief",
      owner: "Finance Director",
      due: "Today",
      detail: "Send viability, path-to-win, and fundraising pulse memo."
    }
  ]
};

function toneClass(v) {
  return String(v).startsWith("-") ? "down" : "up";
}

const FundraisingDashboard = () => {
  const fetcher = useCallback(() => api.fundraising(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Fundraising Terminal"
      title="Monitor capital flow, donor confidence, and finance-channel strength like a campaign markets desk."
      description="Track money velocity, donor segment performance, burn efficiency, and the finance actions that protect momentum and expand runway."
      metrics={data?.metrics || []}
    >
      <Panel title="Revenue Channel Board" subtitle="Where money is coming from and which channels are accelerating">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Channel</span>
              <span>Raised</span>
              <span>Change</span>
              <span>Mix</span>
            </div>
            {data.channels.map((row) => (
              <div key={row.channel} className="vs-table-row">
                <span>{row.channel}</span>
                <span>{row.amount}</span>
                <span className={toneClass(row.change)}>{row.change}</span>
                <span>{row.mix}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Candidate Finance Board" subtitle="Comparative fundraising and cash position by top campaigns">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Campaign</span>
              <span>Raised</span>
              <span>Cash</span>
              <span>Burn</span>
              <span>Trend</span>
            </div>
            {data.board.map((row) => (
              <div key={row.name} className="vs-table-row vs-table-row-five">
                <span>{row.name}</span>
                <span>{row.raised}</span>
                <span>{row.cash}</span>
                <span>{row.burn}</span>
                <span className={toneClass(row.trend)}>{row.trend}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Executive Finance Actions" subtitle="Highest-leverage next moves for the finance team" large>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-finance-action-list">
            {data.actions.map((item) => (
              <div key={item.title} className="vs-finance-action-item">
                <div className="vs-finance-action-top">
                  <div className="vs-finance-action-title">{item.title}</div>
                  <div className="vs-finance-action-due">{item.due}</div>
                </div>
                <div className="vs-finance-action-owner">Owner: {item.owner}</div>
                <div className="vs-finance-action-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default FundraisingDashboard;
