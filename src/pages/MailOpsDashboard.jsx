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
import useLiveChannel from "../hooks/useLiveChannel";

function toneForStatus(value) {
  const v = String(value || "").toLowerCase();
  if (v === "elevated" || v === "delayed") return "danger";
  if (v === "on track" || v === "delivered" || v === "resolved") return "active";
  if (v === "scheduled" || v === "in transit") return "info";
  if (v === "pending") return "demo";
  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  if (v === "low") return "info";
  return "default";
}

function DropRow({ row }) {
  return (
    <ResponsiveRow
      title={row.campaign}
      subtitle={`${row.location} • In-home ${row.in_home || "TBD"}`}
      meta={[
        { label: "Status", value: row.status },
        { label: "Location", value: row.location },
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
        { label: "Source", value: row.source },
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

function EventRow({ row }) {
  return (
    <ResponsiveRow
      title={row.campaign}
      subtitle={`${row.location} • ${row.state} • ${row.office} • ${row.event_type}`}
      meta={[
        { label: "Status", value: row.status },
        { label: "Severity", value: row.severity },
      ]}
      alert={
        String(row.severity || "").toLowerCase() === "high"
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
      right={<Badge tone={toneForStatus(row.status)}>{row.status}</Badge>}
    />
  );
}

const fallbackData = {
  metrics: [
    { label: "Mail Drops", value: "18", delta: "4 active today", tone: "up" },
    { label: "Delivery Risk", value: "3", delta: "2 elevated", tone: "down" },
    { label: "Postal Alerts", value: "7", delta: "Live monitoring", tone: "up" },
    { label: "On-Time Rate", value: "94%", delta: "+2.1%", tone: "up" },
  ],
  drops: [
    {
      id: 1,
      campaign: "GA Senate Victory",
      location: "Atlanta NDC",
      status: "Elevated",
      in_home: "2026-10-14",
      note: "Watch weekend clearance volume",
    },
    {
      id: 2,
      campaign: "PA Governor Push",
      location: "Philadelphia P&DC",
      status: "On Track",
      in_home: "2026-10-16",
      note: "Vendor scan performance stable",
    },
  ],
  alerts: [
    {
      id: 1,
      title: "Atlanta NDC delay pressure increasing",
      severity: "High",
      source: "MailOps",
      detail: "Projected slip risk on high-volume trays.",
    },
    {
      id: 2,
      title: "Philadelphia scan recovery improving",
      severity: "Medium",
      source: "MailOps",
      detail: "Recent tray movement indicates stabilization.",
    },
  ],
  _demo: true,
};

const fallbackEvents = {
  results: [
    {
      id: 1,
      campaign: "GA Senate Victory",
      state: "Georgia",
      office: "Senate",
      risk: "Elevated",
      location: "Atlanta NDC",
      vendor_name: "Precision Mail Group",
      event_type: "delay_alert",
      status: "Elevated",
      severity: "High",
      event_time: "2026-10-11T10:30:00Z",
      in_home: "2026-10-14",
      note: "Tray movement slowed during weekend processing",
    },
  ],
  _demo: true,
};

function dedupeById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return !item?.id;
    seen.add(item.id);
    return true;
  });
}

export default function MailOpsDashboard() {
  const { demoMode } = useDemoMode();
  const { filters } = useExecutiveFilters();

  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState("");
  const [eventError, setEventError] = useState("");
  const [liveBanner, setLiveBanner] = useState("");
  const [data, setData] = useState(fallbackData);
  const [eventsData, setEventsData] = useState(fallbackEvents);
  const [isDemoData, setIsDemoData] = useState(Boolean(fallbackData._demo));
  const [isDemoEvents, setIsDemoEvents] = useState(Boolean(fallbackEvents._demo));

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

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        setLoadingEvents(true);
        setEventError("");

        const params = {};
        if (filters.state) params.state = filters.state;
        if (filters.office) params.office = filters.office;
        if (filters.risk) params.risk = filters.risk;

        const response = await api.mailOpsEvents(params);

        if (!active) return;
        setEventsData(response || fallbackEvents);
        setIsDemoEvents(Boolean(response?._demo || response?.demo));
      } catch (err) {
        if (!active) return;
        setEventError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load MailOps events"
        );
        setEventsData(fallbackEvents);
        setIsDemoEvents(true);
      } finally {
        if (active) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => {
      active = false;
    };
  }, [filters.state, filters.office, filters.risk]);

  useLiveChannel("intelligence:mailops", (event) => {
    if (!event?.type || !event?.payload?.event) return;

    const incomingEvent = event.payload.event;
    const incomingAlert = event.payload.alert || null;

    setLiveBanner(
      event.type === "mailops.event_created"
        ? `Live MailOps event created: ${incomingEvent.campaign} • ${incomingEvent.location}`
        : `Live MailOps event updated: ${incomingEvent.campaign} • ${incomingEvent.location}`
    );

    setEventsData((prev) => {
      const current = prev?.results || [];
      const updated =
        event.type === "mailops.event_updated"
          ? current.map((row) => (row.id === incomingEvent.id ? incomingEvent : row))
          : [incomingEvent, ...current];

      return {
        ...(prev || {}),
        results: dedupeById(updated),
      };
    });

    if (incomingAlert) {
      setData((prev) => {
        const nextAlerts = dedupeById([incomingAlert, ...(prev?.alerts || [])]).slice(0, 10);
        return {
          ...(prev || fallbackData),
          alerts: nextAlerts,
        };
      });
    }
  });

  useEffect(() => {
    if (!liveBanner) return;
    const timer = setTimeout(() => setLiveBanner(""), 5000);
    return () => clearTimeout(timer);
  }, [liveBanner]);

  const drops = useMemo(() => data?.drops || [], [data]);
  const alerts = useMemo(() => data?.alerts || [], [data]);
  const events = useMemo(() => eventsData?.results || [], [eventsData]);

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
        { label: "Drops", value: `${drops.length}`, dotClass: "vs-live-dot-success" },
        { label: "Elevated", value: `${elevatedDrops}`, dotClass: "vs-live-dot" },
        { label: "Alerts", value: `${highAlerts} high`, dotClass: "vs-live-dot-warning" },
      ]}
    >
      <DemoBanner
        active={isDemoData || isDemoEvents}
        text="Demo MailOps data is active for part of this module."
      />

      {liveBanner ? <div className="vs-banner">{liveBanner}</div> : null}
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {eventError ? <div className="vs-banner vs-banner-danger">{eventError}</div> : null}

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

      <SectionCard
        title="Live MailOps Event Stream"
        subtitle="Operational event queue updates in real time."
        right={<Badge tone={isDemoEvents ? "demo" : "active"}>{isDemoEvents ? "Demo Events" : "Live Events"}</Badge>}
      >
        <div className="vs-stack">
          {loadingEvents ? (
            <EmptyState text="Loading MailOps events..." />
          ) : !events.length ? (
            <EmptyState text="No MailOps events available." />
          ) : (
            events.map((row) => <EventRow key={row.id} row={row} />)
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
