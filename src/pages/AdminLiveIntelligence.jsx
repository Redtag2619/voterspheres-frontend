import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { api } from "../services/api";

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
}

function severityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  return "default";
}

function riskTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "elevated" || v === "high") return "danger";
  if (v === "watch") return "demo";
  if (v === "monitor") return "info";
  return "default";
}

function FeedPreviewCard({ item }) {
  return (
    <div
      className="vs-card"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        minHeight: "200px"
      }}
    >
      <div style={{ minHeight: "56px" }}>
        <div style={{ fontSize: "16px", fontWeight: 800, lineHeight: 1.15 }}>
          {item.title}
        </div>
        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: "var(--vs-text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={[item.source, item.type, item.state, item.office].filter(Boolean).join(" • ")}
        >
          {[item.source, item.type, item.state, item.office].filter(Boolean).join(" • ")}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px 18px",
          marginTop: "14px",
          minHeight: "72px"
        }}
      >
        <div>
          <div className="vs-stat-label">Time</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 700 }}>
            {item.time || "Now"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Severity</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 700 }}>
            {item.severity || "Info"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">State</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 700 }}>
            {item.state || "National"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Risk</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 700 }}>
            {item.risk || "Monitor"}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "14px",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap"
        }}
      >
        <Badge tone={severityTone(item.severity)}>{item.severity || "Info"}</Badge>
        <Badge tone={riskTone(item.risk)}>{item.risk || "Monitor"}</Badge>
      </div>
    </div>
  );
}

export default function AdminLiveIntelligence() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusData, setStatusData] = useState({
    summary: {
      feed_events: 0,
      candidates: 0,
      vendors: 0,
      last_feed_event_at: null,
      last_fundraising_sync_at: null
    },
    recentFeed: []
  });

  async function loadStatus() {
    const response = await api.get("/intelligence/status", { timeout: 10000 });
    setStatusData(response?.data || {
      summary: {},
      recentFeed: []
    });
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/intelligence/status", { timeout: 10000 });

        if (!active) return;
        setStatusData(response?.data || statusData);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load live intelligence status");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleRefreshNow() {
    try {
      setRefreshing(true);
      setError("");
      await api.post("/intelligence/refresh", {});
      await loadStatus();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to refresh live intelligence");
    } finally {
      setRefreshing(false);
    }
  }

  const summaryCards = useMemo(() => {
    const summary = statusData?.summary || {};
    return [
      {
        label: "Feed Events",
        value: String(summary.feed_events || 0),
        delta: "Stored executive events",
        tone: "up"
      },
      {
        label: "Candidates",
        value: String(summary.candidates || 0),
        delta: "Imported candidate records",
        tone: "up"
      },
      {
        label: "Vendors",
        value: String(summary.vendors || 0),
        delta: "Operational vendor records",
        tone: "up"
      },
      {
        label: "Last Fundraising Sync",
        value: summary.last_fundraising_sync_at ? "Live" : "Waiting",
        delta: formatDateTime(summary.last_fundraising_sync_at),
        tone: summary.last_fundraising_sync_at ? "up" : "down"
      }
    ];
  }, [statusData]);

  return (
    <PageShell
      eyebrow="Admin"
      title="Live Intelligence"
      description="Monitor refresh health, preview executive feed events, and trigger a fresh intelligence rebuild."
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "16px"
        }}
      >
        <div style={{ color: "var(--vs-text-muted)", fontSize: "14px" }}>
          Last feed event: {formatDateTime(statusData?.summary?.last_feed_event_at)}
        </div>

        <button
          type="button"
          className="vs-button"
          onClick={handleRefreshNow}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Now"}
        </button>
      </div>

      <div className="vs-grid-4">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            delta={card.delta}
            tone={card.tone}
          />
        ))}
      </div>

      <SectionCard
        title="Sync Status"
        subtitle="Operational overview of the continuously updating intelligence system."
      >
        <div className="vs-grid-3">
          <div className="vs-card" style={{ padding: "16px" }}>
            <div className="vs-stat-label">Feed Status</div>
            <div style={{ marginTop: "10px", fontSize: "24px", fontWeight: 850 }}>
              {statusData?.summary?.feed_events ? "Healthy" : "Waiting"}
            </div>
            <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--vs-text-muted)" }}>
              {statusData?.summary?.feed_events
                ? `${statusData.summary.feed_events} stored feed events available`
                : "No stored feed events yet"}
            </div>
          </div>

          <div className="vs-card" style={{ padding: "16px" }}>
            <div className="vs-stat-label">Fundraising Sync</div>
            <div style={{ marginTop: "10px", fontSize: "24px", fontWeight: 850 }}>
              {statusData?.summary?.last_fundraising_sync_at ? "Live" : "Pending"}
            </div>
            <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--vs-text-muted)" }}>
              {formatDateTime(statusData?.summary?.last_fundraising_sync_at)}
            </div>
          </div>

          <div className="vs-card" style={{ padding: "16px" }}>
            <div className="vs-stat-label">Last Feed Event</div>
            <div style={{ marginTop: "10px", fontSize: "24px", fontWeight: 850 }}>
              {statusData?.summary?.last_feed_event_at ? "Recorded" : "None"}
            </div>
            <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--vs-text-muted)" }}>
              {formatDateTime(statusData?.summary?.last_feed_event_at)}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Feed Event Preview"
        subtitle="Latest stored executive events driving the dashboard."
        right={<Badge tone="info">{statusData?.recentFeed?.length || 0} events</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading live intelligence status..." />
          ) : !(statusData?.recentFeed || []).length ? (
            <EmptyState text="No feed events available yet." />
          ) : (
            statusData.recentFeed.map((item) => (
              <FeedPreviewCard key={item.id} item={item} />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
