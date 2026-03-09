import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "Active Donor Networks", value: "86", delta: "+7 this month", tone: "up" },
    { label: "Influence Clusters", value: "24", delta: "+3", tone: "up" },
    { label: "At-Risk Capital", value: "$4.2M", delta: "+8.1%", tone: "down" },
    { label: "High-Confidence Channels", value: "18", delta: "+5", tone: "up" }
  ],
  clusters: [
    { name: "Digital Small-Dollar Coalition", score: 93, trend: "+6.2", influence: "National", note: "Highest growth efficiency and repeat conversion." },
    { name: "National Finance Chairs", score: 89, trend: "+2.8", influence: "National", note: "Large-dollar backbone with durable reach." }
  ],
  networkMap: [
    { cluster: "Northeast Finance Corridor", raised: "$5.8M", velocity: "+14%", confidence: "High", status: "Scaling" },
    { cluster: "Pacific Digital Donor Base", raised: "$4.9M", velocity: "+21%", confidence: "High", status: "Breakout" }
  ],
  notes: [
    { title: "Most valuable network right now", detail: "Digital small-dollar remains the most durable capital source." },
    { title: "Greatest donor-side vulnerability", detail: "Regional business donors remain most exposed to confidence shocks." }
  ]
};

function toneClass(v) {
  return String(v).startsWith("-") ? "down" : "up";
}

function scoreWidth(v) {
  return { width: `${v}%` };
}

const DonorNetwork = () => {
  const fetcher = useCallback(() => api.donors(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Donor Network Intelligence"
      title="Track donor influence, capital movement, and network confidence across the political money map."
      description="VoterSpheres maps how donor clusters behave, where capital is flowing, and which networks can most shape a campaign’s strategic runway."
      metrics={data?.metrics || []}
    >
      <Panel title="Donor Cluster Strength" subtitle="Highest-performing ecosystems by influence and reliability">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-donor-cluster-list">
            {data.clusters.map((item) => (
              <div key={item.name} className="vs-donor-cluster-item">
                <div className="vs-donor-cluster-top">
                  <div>
                    <div className="vs-donor-cluster-name">{item.name}</div>
                    <div className="vs-donor-cluster-scope">{item.influence} influence</div>
                  </div>
                  <div className="vs-donor-cluster-side">
                    <div className="vs-donor-cluster-score">{item.score}</div>
                    <div className={toneClass(item.trend)}>{item.trend}</div>
                  </div>
                </div>
                <div className="vs-donor-cluster-bar">
                  <div className="vs-donor-cluster-fill" style={scoreWidth(item.score)} />
                </div>
                <div className="vs-donor-cluster-note">{item.note}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Regional Network Map" subtitle="Capital velocity, confidence, and network condition by cluster">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Cluster</span>
              <span>Raised</span>
              <span>Velocity</span>
              <span>Confidence</span>
              <span>Status</span>
            </div>
            {data.networkMap.map((row) => (
              <div key={row.cluster} className="vs-table-row vs-table-row-five">
                <span>{row.cluster}</span>
                <span>{row.raised}</span>
                <span className={toneClass(row.velocity)}>{row.velocity}</span>
                <span>{row.confidence}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="AI Donor Notes" subtitle="Machine-assisted interpretation of donor-network strength" large>
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

export default DonorNetwork;
