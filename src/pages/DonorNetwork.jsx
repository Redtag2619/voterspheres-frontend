import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function DonorRow({ item }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "1.5fr 1fr 1fr auto",
          alignItems: "start"
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>
            {item.name}
          </div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.85rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {item.location || item.state || "National donor"} • {item.type || "Individual"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Total Given</div>
          <div style={{ marginTop: "0.35rem", fontWeight: 700 }}>
            {formatMoney(item.total || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Affinity</div>
          <div style={{ marginTop: "0.35rem" }}>
            <Badge tone="accent">{item.affinity || "High"}</Badge>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Badge tone={String(item.status || "").toLowerCase() === "active" ? "active" : "default"}>
            {item.status || "tracked"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ClusterCard({ item }) {
  return (
    <div className="vs-card-muted">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{item.name}</div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {item.description}
          </div>
        </div>

        <Badge tone="accent">{item.members} members</Badge>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <div className="vs-stat-label">Combined Capacity</div>
        <div style={{ marginTop: "0.35rem", fontSize: "1.2rem", fontWeight: 700 }}>
          {formatMoney(item.capacity || 0)}
        </div>
      </div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "Tracked Donors", value: "184", delta: "+18 added", tone: "up" },
    { label: "Active Donor Clusters", value: "6", delta: "Regional + national", tone: "up" },
    { label: "Modeled Capacity", value: "$9.4M", delta: "Near-term reachable", tone: "up" },
    { label: "High-Affinity Donors", value: "42", delta: "Priority outreach", tone: "up" }
  ],
  donors: [
    {
      id: 1,
      name: "Patricia Monroe",
      location: "Atlanta, GA",
      type: "Individual",
      total: 125000,
      affinity: "High",
      status: "active"
    },
    {
      id: 2,
      name: "Southern Growth PAC",
      location: "Georgia",
      type: "PAC",
      total: 350000,
      affinity: "High",
      status: "active"
    },
    {
      id: 3,
      name: "Liberty Finance Circle",
      location: "Pennsylvania",
      type: "Donor Circle",
      total: 210000,
      affinity: "Medium",
      status: "tracked"
    }
  ],
  clusters: [
    {
      id: 1,
      name: "Atlanta Executive Circle",
      members: 14,
      capacity: 1800000,
      description: "High-capacity metro donors aligned with persuasion and growth messaging."
    },
    {
      id: 2,
      name: "Regional Business Network",
      members: 22,
      capacity: 2400000,
      description: "Business-focused donor network with strong late-cycle activation potential."
    }
  ]
};

export default function DonorNetwork() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [networkData, setNetworkData] = useState(fallbackData);

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadDonorNetwork() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/donors/network", {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setNetworkData({
          metrics: payload.metrics?.length ? payload.metrics : fallbackData.metrics,
          donors: payload.donors?.length ? payload.donors : fallbackData.donors,
          clusters: payload.clusters?.length ? payload.clusters : fallbackData.clusters
        });
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load donor network"
        );
        setNetworkData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDonorNetwork();

    return () => {
      active = false;
    };
  }, []);

  const donors = useMemo(() => networkData.donors || [], [networkData.donors]);
  const clusters = useMemo(() => networkData.clusters || [], [networkData.clusters]);

  return (
    <PageShell
      eyebrow="Donor Network"
      title="See the finance network behind the campaign."
      description="Track donor relationships, cluster strength, and modeled fundraising capacity across your campaign finance network."
      demo={demoMode}
      demoText="Demo donor network mode is active. Donor relationships and fundraising clusters are preloaded for presentation."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
        {(networkData.metrics || []).map((metric, index) => (
          <StatCard
            key={`${metric.label}-${index}`}
            label={metric.label}
            value={metric.value}
            delta={metric.delta}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="Priority Donor Board"
          subtitle="Highest-value donors and entities currently tracked."
          right={<Badge tone="accent">{donors.length} tracked</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading donor board..." />
            ) : !donors.length ? (
              <EmptyState text="No donor network data available." />
            ) : (
              donors.map((item) => (
                <DonorRow key={`${item.id}-${item.name}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Fundraising Clusters"
          subtitle="Donor groups with shared reach and late-cycle capacity."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading donor clusters..." />
            ) : !clusters.length ? (
              <EmptyState text="No donor clusters available." />
            ) : (
              clusters.map((item) => (
                <ClusterCard key={`${item.id}-${item.name}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
