import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { api } from "../services/api";

function toneForStatus(status) {
  if (status === "sent") return "active";
  if (status === "failed") return "danger";
  if (status === "pending") return "demo";
  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high" || v === "critical") return "danger";
  if (v === "medium") return "demo";
  return "info";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function eventLabel(type = "") {
  return String(type)
    .replaceAll(".", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DeliveryCard({ item }) {
  const payload = item.payload || {};

  return (
    <div
      className="vs-card"
      style={{
        padding: 16,
        display: "grid",
        gap: 12,
        borderLeft: item.status === "failed" ? "4px solid #f87171" : "4px solid #4ade80"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 850 }}>
            {payload.event_title || "Alert delivery"}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--vs-text-muted)" }}>
            {eventLabel(payload.event_type)} • {payload.source || "VoterSpheres"} • {payload.state || "National"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
          <Badge tone={toneForSeverity(payload.severity)}>{payload.severity || "Medium"}</Badge>
          <Badge tone="info">{item.channel}</Badge>
        </div>
      </div>

      <div className="vs-grid-4">
        <div>
          <div className="vs-stat-label">Office</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{payload.office || "—"}</div>
        </div>
        <div>
          <div className="vs-stat-label">Risk</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{payload.risk || "—"}</div>
        </div>
        <div>
          <div className="vs-stat-label">Candidate</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{payload.candidate_name || "—"}</div>
        </div>
        <div>
          <div className="vs-stat-label">Sent</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{formatDate(item.sent_at || item.created_at)}</div>
        </div>
      </div>

      {item.error ? (
        <div className="vs-banner vs-banner-danger" style={{ marginTop: 4 }}>
          {item.error}
        </div>
      ) : null}
    </div>
  );
}

function RuleCard({ rule, onToggle }) {
  return (
    <div className="vs-card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 850 }}>{rule.name}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--vs-text-muted)" }}>
            {rule.channel} → {rule.destination}
          </div>
        </div>
        <Badge tone={rule.is_active ? "active" : "default"}>
          {rule.is_active ? "Active" : "Paused"}
        </Badge>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(rule.event_types || []).map((type) => (
          <Badge key={type} tone="info">{eventLabel(type)}</Badge>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 12, color: "var(--vs-text-muted)" }}>
          Min severity: <strong>{rule.min_severity || "Medium"}</strong>
        </div>
        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onToggle(rule)}
        >
          {rule.is_active ? "Pause" : "Activate"}
        </button>
      </div>
    </div>
  );
}

export default function AdminAlerts() {
  const [rules, setRules] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState("");

  async function loadAlerts() {
    const [rulesRes, deliveriesRes] = await Promise.all([
      api.get("/alerts/rules"),
      api.get("/alerts/deliveries?limit=100")
    ]);

    setRules(rulesRes?.data?.results || []);
    setDeliveries(deliveriesRes?.data?.results || []);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        await loadAlerts();
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load alerts");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function dispatchNow() {
    try {
      setDispatching(true);
      setError("");
      await api.post("/alerts/dispatch", { limit: 25 });
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to dispatch alerts");
    } finally {
      setDispatching(false);
    }
  }

  async function toggleRule(rule) {
    try {
      await api.put(`/alerts/rules/${rule.id}`, {
        is_active: !rule.is_active
      });
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to update rule");
    }
  }

  const grouped = useMemo(() => {
    return {
      high: deliveries.filter((d) => ["High", "Critical"].includes(d.payload?.severity)),
      failed: deliveries.filter((d) => d.status === "failed"),
      sent: deliveries.filter((d) => d.status === "sent")
    };
  }, [deliveries]);

  const metrics = [
    {
      label: "Active Rules",
      value: String(rules.filter((r) => r.is_active).length),
      delta: `${rules.length} total rules`,
      tone: "up"
    },
    {
      label: "Sent Alerts",
      value: String(grouped.sent.length),
      delta: "Recent deliveries",
      tone: "up"
    },
    {
      label: "Failed Alerts",
      value: String(grouped.failed.length),
      delta: grouped.failed.length ? "Needs attention" : "Clean",
      tone: grouped.failed.length ? "down" : "up"
    },
    {
      label: "High Priority",
      value: String(grouped.high.length),
      delta: "Executive-level signals",
      tone: grouped.high.length ? "down" : "up"
    }
  ];

  return (
    <PageShell
      eyebrow="Admin"
      title="Alert Command Center"
      description="Bloomberg-style signal monitoring for email, Slack, executive feed, news, polling, vendor gaps, and fundraising alerts."
      tickerItems={[
        { label: "High Priority", value: `${grouped.high.length}`, dotClass: "vs-live-dot" },
        { label: "Sent", value: `${grouped.sent.length}`, dotClass: "vs-live-dot-success" },
        { label: "Failed", value: `${grouped.failed.length}`, dotClass: grouped.failed.length ? "vs-live-dot" : "vs-live-dot-success" }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ color: "var(--vs-text-muted)", fontSize: 14 }}>
          Prioritized alert delivery across political intelligence signals.
        </div>
        <button className="vs-button" onClick={dispatchNow} disabled={dispatching}>
          {dispatching ? "Dispatching..." : "Dispatch Alerts Now"}
        </button>
      </div>

      <div className="vs-grid-4">
        {metrics.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>

      <SectionCard
        title="Priority Rail"
        subtitle="High-severity alerts leadership should see first."
        right={<Badge tone="danger">{grouped.high.length} high</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading priority alerts..." />
          ) : !grouped.high.length ? (
            <EmptyState text="No high-priority alerts in the recent window." />
          ) : (
            grouped.high.slice(0, 8).map((item) => (
              <DeliveryCard key={item.id} item={item} />
            ))
          )}
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: 16 }}>
        <SectionCard title="Alert Rules" subtitle="Control what channels receive each signal type.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading rules..." />
            ) : !rules.length ? (
              <EmptyState text="No alert rules configured yet." />
            ) : (
              rules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Delivery Tape"
          subtitle="Most recent delivery attempts, grouped like an intelligence terminal."
          right={<Badge tone="info">{deliveries.length} recent</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading delivery tape..." />
            ) : !deliveries.length ? (
              <EmptyState text="No deliveries yet." />
            ) : (
              deliveries.slice(0, 20).map((item) => (
                <DeliveryCard key={item.id} item={item} />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
