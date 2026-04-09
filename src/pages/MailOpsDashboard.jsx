import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import DemoBanner from "../components/ui/DemoBanner";
import { useDemoMode } from "../context/DemoModeContext.jsx";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";

function toneForStatus(value) {
  const v = String(value || "").toLowerCase();
  if (v === "elevated") return "danger";
  if (v === "on track") return "active";
  if (v === "watch") return "demo";
  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  return "default";
}

function DropRow({ row }) {
  return (
    <ResponsiveRow
      title={row.campaign}
      subtitle={`${row.location} • In-home ${row.in_home}`}
      meta={[
        { label: "Status", value: row.status },
        { label: "Location", value: row.location }
      ]}
      alert={
        String(row.status || "").toLowerCase() === "elevated"
          ? "vs-live-dot"
          : "vs-live-dot-success"
      }
      right={<Badge tone={toneForStatus(row.status)}>{row.status}</Badge>}
    />
  );
}

function AlertRow({ row }) {
  return (
    <ResponsiveRow
      title={row.title}
      subtitle={`${row.source} • ${row.detail}`}
      meta={[
        { label: "Severity", value: row.severity },
        { label: "Source", value: row.source }
      ]}
      alert={
        String(row.severity || "").toLowerCase() === "high"
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
      right={<Badge tone={toneForSeverity(row.severity)}>{row.severity}</Badge>}
    />
  );
}

const fallbackData = {
  metrics: [
    { label: "Mail Drops", value: "18", delta: "4 active today", tone: "up" },
    { label: "Delivery Risk", value: "3", delta: "2 elevated", tone: "down" },
    { label: "Postal Alerts", value: "7", delta: "Live monitoring", tone: "up" },
    { label: "On-Time Rate", value: "94%", delta: "+2.1%", tone: "up" }
  ],
  drops: [
    {
      id: 1,
      campaign: "GA Senate Victory",
      location: "Atlanta NDC",
      status: "Elevated",
      in_home: "2026-10-14",
      note: "Watch weekend clearance volume"
    },
    {
      id: 2,
      campaign: "PA Governor Push",
      location: "Philadelphia P&DC",
      status: "On Track",
      in_home: "2026-10-16",
      note: "Vendor scan performance stable"
    }
  ],
  alerts: [
    {
      id: 1,
      title: "Atlanta NDC delay pressure increasing",
      severity: "High",
      source: "MailOps",
      detail: "Projected slip risk on high-volume trays."
    },
    {
      id: 2,
      title: "Philadelphia scan recovery improving",
      severity: "Medium",
      source: "MailOps",
      detail: "Recent tray movement indicates stabilization."
    }
  ],
  _demo: true
};

export default function MailOpsDashboard() {
  const { demoMode } = useDemoMode();
  const { filters } = useExecutiveFilters();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(fallbackData);
  const [isDemoData, setIsDemoData] = useState(Boolean(fallbackData._demo));

  useEffect(() => {
    let active = true;

    async function loadMailOps() {
      try {
        setLoading(true);
        setError("");

        const response = await api.mailOpsDashboard();

        if (!active) return;

        setData(response || fallbackData);
        setIsDemoData(Boolean(response?._demo || response?.demo));
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load MailOps dashboard"
        );
        setData(fallbackData);
        setIsDemoData(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMailOps();

    return () => {
      active = false;
    };
  }, []);

  const drops = useMemo(() => data?.drops || [], [data]);
  const alerts = useMemo(() => data?.alerts || [], [data]);

  const elevatedDrops = drops.filter(
    (row) => String(row.status || "").toLowerCase() === "elevated"
  ).length;

  const highAlerts = alerts.filter(
    (row) => String(row.severity || "").toLowerCase() === "high"
  ).length;

  return (
    <PageShell
      eyebrow="MailOps Dashboard"
      title="Track mail execution, delivery risk, and postal disruption."
      description="Monitor drop performance, scan stability, in-home timing, and operational alerts from one executive mail view."
      demo={demoMode}
      demoText="Global Demo Mode is active. This module can render fallback MailOps data when live endpoints are unavailable."
      tickerItems={[
        {
          label: "Drops",
          value: `${drops.length}`,
          dotClass: "vs-live-dot-success"
        },
        {
          label: "Elevated",
          value: `${elevatedDrops}`,
          dotClass: "vs-live-dot"
        },
        {
          label: "Alerts",
          value: `${highAlerts} high`,
          dotClass: "vs-live-dot-warning"
        }
      ]}
    >
      <DemoBanner
        active={isDemoData}
        text="Demo MailOps data is active for this module."
      />

      {filters.state || filters.office || filters.risk ? (
        <div className="vs-banner">
          Executive filters are active for this session:
          {filters.state ? ` state: ${filters.state};` : ""}
          {filters.office ? ` office: ${filters.office};` : ""}
          {filters.risk ? ` risk: ${filters.risk};` : ""}
        </div>
      ) : null}

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        {(data?.metrics || []).map((metric, index) => (
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
          title="Active Mail Drops"
          subtitle="Live campaigns and in-home delivery posture."
          right={<Badge tone={isDemoData ? "demo" : "active"}>{isDemoData ? "Demo Data" : "Live Data"}</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading mail drops..." />
            ) : !drops.length ? (
              <EmptyState text="No active mail drops available." />
            ) : (
              drops.map((row) => <DropRow key={row.id || row.campaign} row={row} />)
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Postal Alerts"
          subtitle="Risk signals that may affect delivery or in-home timing."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading postal alerts..." />
            ) : !alerts.length ? (
              <EmptyState text="No postal alerts available." />
            ) : (
              alerts.map((row) => <AlertRow key={row.id || row.title} row={row} />)
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
