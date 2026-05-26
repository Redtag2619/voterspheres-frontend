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
import useRealtimeStream from "../hooks/useRealtimeStream";

const USPS_POLITICAL_MAIL_ALERT_URL =
  "https://tools.usps.com/political-mail-alert.htm";
const USPS_POLITICAL_MAIL_ISSUE_URL =
  "https://tools.usps.com/political-mail-issue.htm";
const USPS_INFORMED_DELIVERY_CAMPAIGN_URL =
  "https://id.usps.com/rminMailerPortal/pages/secure/dashboard.action";

const STATE_OPTIONS = [
  ["", "Select State"],
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["IA", "Iowa"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["MA", "Massachusetts"],
  ["MD", "Maryland"],
  ["ME", "Maine"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MO", "Missouri"],
  ["MS", "Mississippi"],
  ["MT", "Montana"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["NE", "Nebraska"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NV", "Nevada"],
  ["NY", "New York"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VA", "Virginia"],
  ["VT", "Vermont"],
  ["WA", "Washington"],
  ["WI", "Wisconsin"],
  ["WV", "West Virginia"],
  ["WY", "Wyoming"],
  ["DC", "District of Columbia"],
];

function toneForStatus(value) {
  const v = String(value || "").toLowerCase();
  if (["elevated", "delayed", "issue opened"].includes(v)) return "danger";
  if (["on track", "delivered", "resolved", "arrived scf"].includes(v)) return "active";
  if (["scheduled", "in transit", "entered usps", "at printer", "at mailshop"].includes(v)) return "info";
  if (v === "pending") return "demo";
  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (["high", "critical"].includes(v)) return "danger";
  if (v === "medium") return "demo";
  if (v === "low") return "info";
  return "default";
}

function formatDate(value) {
  if (!value) return "TBD";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "TBD";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : date.toLocaleString();
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function pct(numerator, denominator) {
  const total = number(denominator);
  if (!total) return "0%";
  return `${Math.round((number(numerator) / total) * 100)}%`;
}

function getRisk(row = {}) {
  return row.delivery_risk || row.risk || "Monitor";
}

function fileNameFromInput(fileInput) {
  const file = fileInput?.target?.files?.[0];
  return file?.name || "";
}

function uniqueOptions(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function Field({ label, value }) {
  return (
    <div>
      <div className="vs-stat-label">{label}</div>
      <div style={{ marginTop: 4, fontWeight: 800, color: "var(--vs-text)" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function DropRow({ row }) {
  return (
    <ResponsiveRow
      title={row.campaign || row.job_number || "Mail job"}
      subtitle={`${row.office || "Organization"} • ${row.location || "Organization address"} • ${row.state || "State"}`}
      meta={[
        { label: "Job #", value: row.job_number || "N/A" },
        { label: "Assigned", value: row.assigned_to || "Unassigned" },
        { label: "Induction", value: row.induction_facility || row.scf || row.ndc || "TBD" },
        { label: "Risk", value: getRisk(row) },
      ]}
      alert={
        ["elevated", "delayed", "high"].includes(String(getRisk(row)).toLowerCase())
          ? "vs-live-dot"
          : "vs-live-dot-success"
      }
      right={<Badge tone={toneForStatus(row.status)}>{row.status || "Pending"}</Badge>}
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
        { label: "Job #", value: row.job_number || "N/A" },
        { label: "Alert #", value: row.political_mail_alert_confirmation || "N/A" },
        { label: "Issue #", value: row.political_mail_issue_confirmation || "N/A" },
      ]}
      alert={
        ["high", "critical"].includes(String(row.severity || "").toLowerCase())
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
      right={<Badge tone={toneForSeverity(row.severity)}>{row.severity}</Badge>}
    />
  );
}

function EventRow({ row, draft, onDraftChange, onSave, saving }) {
  return (
    <div className="vs-card-muted" style={{ padding: 16 }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span
                className={
                  ["high", "critical"].includes(String(row.severity || "").toLowerCase())
                    ? "vs-live-dot"
                    : "vs-live-dot-warning"
                }
              />
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--vs-text)" }}>
                {row.campaign || "MailOps Job"}
              </div>
              <Badge tone="info">{row.job_number || "No Job #"}</Badge>
              <Badge tone={toneForSeverity(row.severity)}>{row.severity || "Medium"}</Badge>
              <Badge tone={toneForStatus(row.status)}>{row.status || "Pending"}</Badge>
            </div>

            <div style={{ marginTop: 6, fontSize: 13, color: "var(--vs-text-muted)" }}>
              {row.office || "Organization"} • {row.location || "Organization address"} • {row.state || "State"}
            </div>
          </div>

          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="vs-button vs-button-secondary" href={USPS_POLITICAL_MAIL_ALERT_URL} target="_blank" rel="noreferrer">
              USPS Political Mail Alert
            </a>
            <a className="vs-button vs-button-secondary" href={USPS_POLITICAL_MAIL_ISSUE_URL} target="_blank" rel="noreferrer">
              USPS Mail Issue
            </a>
            <a className="vs-button" href={row.informed_delivery_campaign_url || USPS_INFORMED_DELIVERY_CAMPAIGN_URL} target="_blank" rel="noreferrer">
              Create Informed Delivery Campaign
            </a>
          </div>
        </div>

        <div className="vs-grid-4">
          <Field label="Assigned To" value={row.assigned_to} />
          <Field label="Date Submitted" value={formatDate(row.date_submitted)} />
          <Field label="Print Vendor" value={row.print_vendor || row.vendor_name} />
          <Field label="Induction Type" value={row.induction_type} />
        </div>

        <div className="vs-grid-4">
          <Field label="Induction Facility" value={row.induction_facility} />
          <Field label="Induction Address" value={row.induction_facility_address} />
          <Field label="SCF" value={row.scf} />
          <Field label="NDC" value={row.ndc} />
        </div>

        <div className="vs-grid-4">
          <Field label="Political Alert Confirmation" value={row.political_mail_alert_confirmation} />
          <Field label="Political Issue Confirmation" value={row.political_mail_issue_confirmation} />
          <Field label="Mail Piece" value={row.mail_piece_file_name} />
          <Field label="PS Forms" value={[row.ps_form_3602_file_name, row.ps_form_8125_file_name].filter(Boolean).join(" / ")} />
        </div>

        <div className="vs-grid-4">
          <Field label="USPS Status" value={row.usps_status} />
          <Field label="Last Scan" value={formatDateTime(row.usps_last_scan_date)} />
          <Field label="Expected SCF Arrival" value={formatDate(row.expected_scf_arrival_date)} />
          <Field label="Actual SCF Arrival" value={formatDate(row.actual_scf_arrival_date)} />
        </div>

        <div style={{ fontSize: 13, color: "var(--vs-text-muted)", lineHeight: 1.6 }}>
          {row.note || row.notes || "No notes yet."}
        </div>

        <div className="vs-grid-4">
          <input
            className="vs-input"
            placeholder="Political Alert Confirmation #"
            value={draft.political_mail_alert_confirmation || ""}
            onChange={(e) => onDraftChange(row.id, { ...draft, political_mail_alert_confirmation: e.target.value })}
          />
          <input
            className="vs-input"
            placeholder="Political Mail Problem Confirmation #"
            value={draft.political_mail_issue_confirmation || ""}
            onChange={(e) => onDraftChange(row.id, { ...draft, political_mail_issue_confirmation: e.target.value })}
          />
          <input
            className="vs-input"
            placeholder="Informed Delivery Campaign Name"
            value={draft.informed_delivery_campaign_name || ""}
            onChange={(e) => onDraftChange(row.id, { ...draft, informed_delivery_campaign_name: e.target.value })}
          />
          <input
            className="vs-input"
            placeholder="Informed Delivery Campaign ID"
            value={draft.informed_delivery_campaign_id || ""}
            onChange={(e) => onDraftChange(row.id, { ...draft, informed_delivery_campaign_id: e.target.value })}
          />
        </div>

        <div className="vs-grid-4">
          <select
            className="vs-select"
            value={draft.status}
            onChange={(e) => onDraftChange(row.id, { ...draft, status: e.target.value })}
          >
            {[
              "Pending",
              "Scheduled",
              "At Printer",
              "At Mailshop",
              "Entered USPS",
              "In Transit",
              "Arrived SCF",
              "On Track",
              "Elevated",
              "Delivered",
              "Delayed",
              "Issue Opened",
              "Resolved",
            ].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            className="vs-select"
            value={draft.severity}
            onChange={(e) => onDraftChange(row.id, { ...draft, severity: e.target.value })}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <input
            className="vs-input"
            type="date"
            title="Actual SCF arrival"
            value={draft.actual_scf_arrival_date || ""}
            onChange={(e) => onDraftChange(row.id, { ...draft, actual_scf_arrival_date: e.target.value })}
          />

          <input
            className="vs-input"
            type="date"
            title="Actual in-home date"
            value={draft.actual_in_home_date || ""}
            onChange={(e) => onDraftChange(row.id, { ...draft, actual_in_home_date: e.target.value })}
          />
        </div>

        <textarea
          className="vs-textarea"
          rows={3}
          value={draft.note}
          onChange={(e) => onDraftChange(row.id, { ...draft, note: e.target.value })}
          placeholder="Update operational note..."
        />

        <div className="vs-inline-actions">
          <button type="button" className="vs-button vs-button-primary" onClick={() => onSave(row.id)} disabled={saving}>
            {saving ? "Saving..." : "Save MailOps Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "Mail Jobs", value: "0", delta: "No live jobs", tone: "up" },
    { label: "Delivery Risk", value: "0", delta: "No elevated risk", tone: "up" },
    { label: "SCF Pending", value: "0", delta: "Awaiting SCF arrival", tone: "neutral" },
    { label: "USPS Confirmations", value: "0", delta: "Confirmation posture clean", tone: "up" },
  ],
  drops: [],
  alerts: [],
  intelligence: {},
  _demo: true,
};

const fallbackEvents = {
  results: [],
  _demo: true,
};

const emptyComposer = {
  campaign: "",
  state: "",
  office: "",
  risk: "",
  location: "",
  vendor_name: "",
  event_type: "mail_update",
  status: "Pending",
  severity: "Medium",
  event_time: "",
  in_home: "",
  note: "",

  job_number: "",
  assigned_to: "",
  date_submitted: "",
  print_vendor: "",
  mail_class: "Marketing Mail",
  mail_format: "Letter",
  quantity: "",
  pieces_mailed: "",
  postage_statement_id: "",
  permit_number: "",
  crid: "",
  mid: "",
  imb_mid: "",
  imb_serial_range: "",
  usps_job_id: "",
  usps_status: "",
  usps_last_scan_date: "",
  usps_last_scan_facility: "",
  usps_last_scan_city: "",
  usps_last_scan_state: "",
  expected_scf_arrival_date: "",
  actual_scf_arrival_date: "",
  scf: "",
  scf_address: "",
  ndc: "",
  ndc_address: "",
  induction_type: "BMEU",
  induction_facility: "",
  induction_facility_address: "",
  estimated_in_home_date: "",
  actual_in_home_date: "",
  delivery_risk: "Watch",
  snailworks_job_id: "",
  snailworks_campaign_id: "",
  snailworks_status: "",
  tracking_source: "manual",
  issue_status: "",
  issue_notes: "",

  political_mail_alert_confirmation: "",
  political_mail_issue_confirmation: "",
  informed_delivery_campaign_name: "",
  informed_delivery_campaign_id: "",
  informed_delivery_campaign_url: USPS_INFORMED_DELIVERY_CAMPAIGN_URL,

  mail_piece_file_name: "",
  mail_piece_url: "",
  ps_form_3602_file_name: "",
  ps_form_3602_url: "",
  ps_form_8125_file_name: "",
  ps_form_8125_url: "",
};

export default function MailOpsDashboard() {
  const { demoMode } = useDemoMode();
  const { filters } = useExecutiveFilters();

  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState("");
  const [eventError, setEventError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [data, setData] = useState(fallbackData);
  const [eventsData, setEventsData] = useState(fallbackEvents);
  const [mailOpsOptions, setMailOpsOptions] = useState({
    assigned_to: [],
    print_vendors: [],
    permit_numbers: [],
    crids: [],
    mids: [],
    organizations: [],
    organization_addresses: [],
    facilities: [],
    scfs: [],
    ndcs: [],
    bmeus: [],
    ddus: [],
  });
  const [isDemoData, setIsDemoData] = useState(Boolean(fallbackData._demo));
  const [isDemoEvents, setIsDemoEvents] = useState(Boolean(fallbackEvents._demo));
  const [savingEventId, setSavingEventId] = useState(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [composerOpen, setComposerOpen] = useState(true);
  const [composer, setComposer] = useState({
    ...emptyComposer,
    state: filters.state || "",
    office: filters.office || "",
    risk: filters.risk || "",
  });

  const [eventDrafts, setEventDrafts] = useState({});

  useRealtimeStream("intelligence:mailops", (event) => {
    const payload = event?.payload || {};
    const liveEvent = payload.event || null;
    const liveAlert = payload.alert || null;

    if (liveEvent) {
      setEventsData((prev) => {
        const existing = prev?.results || [];
        const withoutDuplicate = existing.filter((row) => row.id !== liveEvent.id);
        return { ...(prev || {}), results: [liveEvent, ...withoutDuplicate].slice(0, 150), _demo: false, demo: false };
      });

      setData((prev) => {
        const existingDrops = prev?.drops || [];
        const withoutDuplicateDrops = existingDrops.filter((row) => row.id !== liveEvent.id);
        return { ...(prev || fallbackData), drops: [liveEvent, ...withoutDuplicateDrops].slice(0, 20), _demo: false, demo: false };
      });

      setIsDemoEvents(false);
      setIsDemoData(false);
      setSuccessMessage(`Live MailOps update received: ${liveEvent.campaign || "New event"}`);
    }

    if (liveAlert) {
      setData((prev) => {
        const existingAlerts = prev?.alerts || [];
        const withoutDuplicateAlerts = existingAlerts.filter((row) => row.id !== liveAlert.id);
        return { ...(prev || fallbackData), alerts: [liveAlert, ...withoutDuplicateAlerts].slice(0, 20), _demo: false, demo: false };
      });

      setIsDemoData(false);
    }
  });

  useEffect(() => {
    setComposer((prev) => ({
      ...prev,
      state: filters.state || prev.state || "",
      office: filters.office || prev.office || "",
      risk: filters.risk || prev.risk || "",
    }));
  }, [filters.state, filters.office, filters.risk]);

  async function loadDashboard() {
    const response = await api.mailOpsDashboard();
    setData(response || fallbackData);
    setIsDemoData(Boolean(response?._demo || response?.demo));
  }

  async function loadOptions() {
    try {
      const response = api.mailOpsOptions
        ? await api.mailOpsOptions()
        : (await api.get("/mailops/options")).data;

      setMailOpsOptions(response || {});
    } catch (err) {
      console.warn("MailOps options failed:", err?.message || err);
    }
  }

  async function refreshEvents() {
    const params = {};
    if (filters.state) params.state = filters.state;
    if (filters.office) params.office = filters.office;
    if (filters.risk) params.risk = filters.risk;

    const response = api.mailOpsEvents
      ? await api.mailOpsEvents(params)
      : (await api.get("/mailops/events", { params })).data;

    setEventsData(response || fallbackEvents);
    setIsDemoEvents(Boolean(response?._demo || response?.demo));
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [dashboardResponse] = await Promise.all([
          api.mailOpsDashboard(),
          loadOptions(),
        ]);

        if (!active) return;
        setData(dashboardResponse || fallbackData);
        setIsDemoData(Boolean(dashboardResponse?._demo || dashboardResponse?.demo));
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load MailOps dashboard");
        setData(fallbackData);
        setIsDemoData(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoadingEvents(true);
        setEventError("");
        await refreshEvents();
      } catch (err) {
        if (!active) return;
        setEventError(err?.response?.data?.error || err?.message || "Failed to load MailOps events");
        setEventsData(fallbackEvents);
        setIsDemoEvents(true);
      } finally {
        if (active) setLoadingEvents(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [filters.state, filters.office, filters.risk]);

  const drops = useMemo(() => data?.drops || [], [data]);
  const alerts = useMemo(() => data?.alerts || [], [data]);
  const events = useMemo(() => eventsData?.results || [], [eventsData]);

  useEffect(() => {
    const nextDrafts = {};
    events.forEach((event) => {
      nextDrafts[event.id] = {
        status: event.status || "Pending",
        severity: event.severity || "Medium",
        note: event.note || "",
        actual_scf_arrival_date: event.actual_scf_arrival_date || "",
        actual_in_home_date: event.actual_in_home_date || "",
        political_mail_alert_confirmation: event.political_mail_alert_confirmation || "",
        political_mail_issue_confirmation: event.political_mail_issue_confirmation || "",
        informed_delivery_campaign_name: event.informed_delivery_campaign_name || "",
        informed_delivery_campaign_id: event.informed_delivery_campaign_id || "",
        informed_delivery_campaign_url: event.informed_delivery_campaign_url || USPS_INFORMED_DELIVERY_CAMPAIGN_URL,
      };
    });
    setEventDrafts(nextDrafts);
  }, [events]);

  const elevatedDrops = drops.filter((row) =>
    ["elevated", "delayed", "high"].includes(String(getRisk(row)).toLowerCase())
  ).length;

  const highAlerts = alerts.filter((row) =>
    ["high", "critical"].includes(String(row.severity || "").toLowerCase())
  ).length;

  const totalPieces = events.reduce((sum, row) => sum + number(row.quantity || row.pieces_mailed), 0);
  const scfArrived = events.filter((row) => row.actual_scf_arrival_date).length;

  function updateComposer(patch) {
    setComposer((prev) => ({ ...prev, ...patch }));
  }

  function handleInductionTypeChange(value) {
    updateComposer({
      induction_type: value,
      induction_facility: "",
      induction_facility_address: "",
    });
  }

  function handleInductionFacilityChange(value) {
    const found = (mailOpsOptions.facilities || []).find(
      (item) =>
        item.name === value &&
        item.facility_type === composer.induction_type
    );

    updateComposer({
      induction_facility: value,
      induction_facility_address: found?.address || "",
    });
  }

  function handleScfChange(value) {
    const selected = (mailOpsOptions.scfs || []).find((item) => item.name === value);
    updateComposer({
      scf: value,
      scf_address: selected?.address || composer.scf_address || "",
    });
  }

  function handleNdcChange(value) {
    const selected = (mailOpsOptions.ndcs || []).find((item) => item.name === value);
    updateComposer({
      ndc: value,
      ndc_address: selected?.address || composer.ndc_address || "",
    });
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setEventError("");
    setSuccessMessage("");
    setCreatingEvent(true);

    try {
      const payload = {
        ...composer,
        event_time: composer.event_time || null,
        in_home: composer.in_home || composer.estimated_in_home_date || null,
      };

      if (api.createMailOpsEvent) {
        await api.createMailOpsEvent(payload);
      } else {
        await api.post("/mailops/events", payload);
      }

      setSuccessMessage("MailOps job created successfully.");
      setComposer({
        ...emptyComposer,
        state: filters.state || "",
        office: filters.office || "",
        risk: filters.risk || "",
      });

      await Promise.all([refreshEvents(), loadDashboard(), loadOptions()]);
    } catch (err) {
      setEventError(err?.response?.data?.error || err?.message || "Failed to create MailOps event");
    } finally {
      setCreatingEvent(false);
    }
  }

  function handleDraftChange(eventId, nextDraft) {
    setEventDrafts((prev) => ({ ...prev, [eventId]: nextDraft }));
  }

  async function handleSaveEvent(eventId) {
    setEventError("");
    setSuccessMessage("");
    setSavingEventId(eventId);

    try {
      const draft = eventDrafts[eventId];
      if (!draft) return;

      if (api.updateMailOpsEvent) {
        await api.updateMailOpsEvent(eventId, draft);
      } else {
        await api.patch(`/mailops/events/${eventId}`, draft);
      }

      setSuccessMessage(`MailOps job #${eventId} updated successfully.`);
      await Promise.all([refreshEvents(), loadDashboard(), loadOptions()]);
    } catch (err) {
      setEventError(err?.response?.data?.error || err?.message || "Failed to update MailOps event");
    } finally {
      setSavingEventId(null);
    }
  }

  const inductionFacilities = (mailOpsOptions.facilities || []).filter(
    (item) => item.facility_type === composer.induction_type
  );

  return (
    <PageShell
      eyebrow="MailOps Intelligence"
      title="Track political mail execution, USPS risk, SCF movement, and vendor performance."
      description="A full mail operations terminal for job tracking, USPS political mail escalation, IV-MTR readiness, BMEU/SCF/NDC/DDU induction facilities, SnailWorks-style ingestion, Informed Delivery campaigns, and delivery risk monitoring."
      demo={demoMode}
      demoText="Global Demo Mode is active. This module can render fallback MailOps data when live endpoints are unavailable."
      tickerItems={[
        { label: "Jobs", value: `${events.length}`, dotClass: "vs-live-dot-success" },
        { label: "Pieces", value: `${totalPieces.toLocaleString()}`, dotClass: "vs-live-dot-success" },
        { label: "Elevated", value: `${elevatedDrops}`, dotClass: elevatedDrops ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "SCF Arrived", value: `${scfArrived}/${events.length}`, dotClass: "vs-live-dot-warning" },
      ]}
    >
      <DemoBanner active={isDemoData || isDemoEvents} text="Demo MailOps data is active for part of this module." />

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {eventError ? <div className="vs-banner vs-banner-danger">{eventError}</div> : null}
      {successMessage ? <div className="vs-banner">{successMessage}</div> : null}

      <SectionCard
        title="USPS Political Mail Actions"
        subtitle="Fast links for official USPS political mail notices, issue reporting, Informed Delivery campaign setup, and future IV-MTR tracking integration."
        right={<Badge tone="info">USPS / IV-MTR Ready</Badge>}
      >
        <div className="vs-inline-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="vs-button" href={USPS_POLITICAL_MAIL_ALERT_URL} target="_blank" rel="noreferrer">
            Submit USPS Political Mail Alert
          </a>
          <a className="vs-button vs-button-secondary" href={USPS_POLITICAL_MAIL_ISSUE_URL} target="_blank" rel="noreferrer">
            Report USPS Mailing Problem
          </a>
          <a className="vs-button vs-button-secondary" href={USPS_INFORMED_DELIVERY_CAMPAIGN_URL} target="_blank" rel="noreferrer">
            Create Informed Delivery Campaign
          </a>
          <button type="button" className="vs-button vs-button-secondary" onClick={() => Promise.all([refreshEvents(), loadDashboard(), loadOptions()])}>
            Refresh Mail Tracking
          </button>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        {(data?.metrics || []).map((metric, index) => (
          <StatCard key={`${metric.label}-${index}`} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone} />
        ))}
      </div>

      <SectionCard
        title="Mail Job Composer"
        subtitle="Create a political mail job with saved dropdowns, organization fields, native calendar dates, BMEU/SCF/NDC/DDU induction facilities, and Informed Delivery tracking."
        right={
          <div className="vs-inline-actions">
            <Badge tone={isDemoEvents ? "demo" : "active"}>{isDemoEvents ? "Demo Event Layer" : "Live Event Layer"}</Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => setComposerOpen((v) => !v)}>
              {composerOpen ? "Collapse" : "Open Composer"}
            </button>
          </div>
        }
      >
        {composerOpen ? (
          <form onSubmit={handleCreateEvent} className="vs-stack">
            <div className="vs-grid-4">
              <input
                className="vs-input"
                placeholder="Organization"
                list="mailops-organizations"
                value={composer.office}
                onChange={(e) => updateComposer({ office: e.target.value })}
                required
              />

              <input
                className="vs-input"
                placeholder="Organization Address"
                list="mailops-organization-addresses"
                value={composer.location}
                onChange={(e) => updateComposer({ location: e.target.value })}
                required
              />

              <select
                className="vs-select"
                value={composer.state}
                onChange={(e) => updateComposer({ state: e.target.value })}
                required
              >
                {STATE_OPTIONS.map(([value, label]) => (
                  <option key={value || "blank"} value={value}>{label}</option>
                ))}
              </select>

              <input
                className="vs-input"
                placeholder="Print Vendor"
                list="mailops-print-vendors"
                value={composer.print_vendor}
                onChange={(e) => updateComposer({ print_vendor: e.target.value, vendor_name: e.target.value })}
              />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="Job Number" value={composer.job_number} onChange={(e) => updateComposer({ job_number: e.target.value })} />

              <input
                className="vs-input"
                placeholder="Assigned To"
                list="mailops-assigned-to"
                value={composer.assigned_to}
                onChange={(e) => updateComposer({ assigned_to: e.target.value })}
              />

              <input
                className="vs-input"
                type="date"
                title="Date Submitted"
                value={composer.date_submitted}
                onChange={(e) => updateComposer({ date_submitted: e.target.value })}
              />

              <select className="vs-select" value={composer.delivery_risk} onChange={(e) => updateComposer({ delivery_risk: e.target.value, risk: e.target.value })}>
                <option value="Stable">Stable</option>
                <option value="Watch">Watch</option>
                <option value="Elevated">Elevated</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="vs-grid-4">
              <select className="vs-select" value={composer.mail_class} onChange={(e) => updateComposer({ mail_class: e.target.value })}>
                <option value="Marketing Mail">Marketing Mail</option>
                <option value="First-Class Mail">First-Class Mail</option>
              </select>

              <select className="vs-select" value={composer.mail_format} onChange={(e) => updateComposer({ mail_format: e.target.value })}>
                <option value="Letter">Letter</option>
                <option value="Flat">Flat</option>
              </select>

              <input className="vs-input" placeholder="Quantity" type="number" value={composer.quantity} onChange={(e) => updateComposer({ quantity: e.target.value, pieces_mailed: e.target.value })} />
              <input className="vs-input" placeholder="Postage Statement ID" value={composer.postage_statement_id} onChange={(e) => updateComposer({ postage_statement_id: e.target.value })} />
            </div>

            <div className="vs-grid-4">
              <select className="vs-select" value={composer.event_type} onChange={(e) => updateComposer({ event_type: e.target.value })}>
                {["mail_update", "job_created", "drop_created", "print_vendor_update", "entered_usps", "scan_update", "scf_arrival", "delay_alert", "delivery_update", "vendor_update", "issue_opened", "issue_resolved", "snailworks_import", "usps_ivmtr_import", "informed_delivery_campaign"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>

              <select className="vs-select" value={composer.status} onChange={(e) => updateComposer({ status: e.target.value })}>
                {["Pending", "Scheduled", "At Printer", "At Mailshop", "Entered USPS", "In Transit", "Arrived SCF", "On Track", "Elevated", "Delivered", "Delayed", "Issue Opened", "Resolved"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>

              <select className="vs-select" value={composer.severity} onChange={(e) => updateComposer({ severity: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <input className="vs-input" placeholder="Tracking Source" value={composer.tracking_source} onChange={(e) => updateComposer({ tracking_source: e.target.value })} />
            </div>

            <div className="vs-grid-4">
              <select
                className="vs-select"
                value={composer.induction_type}
                onChange={(e) => handleInductionTypeChange(e.target.value)}
              >
                <option value="BMEU">BMEU</option>
                <option value="SCF">SCF</option>
                <option value="NDC">NDC / RPDC</option>
                <option value="DDU">DDU</option>
              </select>

              <input
                className="vs-input"
                placeholder="Induction Facility"
                list="mailops-induction-facilities"
                value={composer.induction_facility}
                onChange={(e) => handleInductionFacilityChange(e.target.value)}
              />

              <input
                className="vs-input"
                placeholder="Induction Facility Address"
                value={composer.induction_facility_address}
                onChange={(e) => updateComposer({ induction_facility_address: e.target.value })}
              />

              <input
                className="vs-input"
                type="date"
                title="Estimated In Home"
                value={composer.estimated_in_home_date}
                onChange={(e) => updateComposer({ estimated_in_home_date: e.target.value, in_home: e.target.value })}
              />
            </div>

            <div className="vs-grid-4">
              <input
                className="vs-input"
                placeholder="SCF"
                list="mailops-scf-list"
                value={composer.scf}
                onChange={(e) => handleScfChange(e.target.value)}
              />

              <input
                className="vs-input"
                placeholder="SCF Address"
                list="mailops-scf-addresses"
                value={composer.scf_address}
                onChange={(e) => updateComposer({ scf_address: e.target.value })}
              />

              <input
                className="vs-input"
                placeholder="NDC"
                list="mailops-ndc-list"
                value={composer.ndc}
                onChange={(e) => handleNdcChange(e.target.value)}
              />

              <input
                className="vs-input"
                placeholder="NDC Address"
                list="mailops-ndc-addresses"
                value={composer.ndc_address}
                onChange={(e) => updateComposer({ ndc_address: e.target.value })}
              />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" type="date" title="Expected SCF Arrival" value={composer.expected_scf_arrival_date} onChange={(e) => updateComposer({ expected_scf_arrival_date: e.target.value })} />
              <input className="vs-input" type="date" title="Actual SCF Arrival" value={composer.actual_scf_arrival_date} onChange={(e) => updateComposer({ actual_scf_arrival_date: e.target.value })} />
              <input className="vs-input" type="date" title="Actual In Home" value={composer.actual_in_home_date} onChange={(e) => updateComposer({ actual_in_home_date: e.target.value })} />
              <input className="vs-input" type="datetime-local" title="USPS Last Scan" value={composer.usps_last_scan_date} onChange={(e) => updateComposer({ usps_last_scan_date: e.target.value })} />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="Permit Number" list="mailops-permit-numbers" value={composer.permit_number} onChange={(e) => updateComposer({ permit_number: e.target.value })} />
              <input className="vs-input" placeholder="CRID" list="mailops-crids" value={composer.crid} onChange={(e) => updateComposer({ crid: e.target.value })} />
              <input className="vs-input" placeholder="MID / IMb MID" list="mailops-mids" value={composer.imb_mid} onChange={(e) => updateComposer({ imb_mid: e.target.value, mid: e.target.value })} />
              <input className="vs-input" placeholder="IMb Serial Range" value={composer.imb_serial_range} onChange={(e) => updateComposer({ imb_serial_range: e.target.value })} />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="USPS Status" value={composer.usps_status} onChange={(e) => updateComposer({ usps_status: e.target.value })} />
              <input className="vs-input" placeholder="Last Scan Facility" value={composer.usps_last_scan_facility} onChange={(e) => updateComposer({ usps_last_scan_facility: e.target.value })} />
              <input className="vs-input" placeholder="SnailWorks Job ID" value={composer.snailworks_job_id} onChange={(e) => updateComposer({ snailworks_job_id: e.target.value })} />
              <input className="vs-input" placeholder="SnailWorks Campaign ID" value={composer.snailworks_campaign_id} onChange={(e) => updateComposer({ snailworks_campaign_id: e.target.value })} />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="Political Alert Confirmation #" value={composer.political_mail_alert_confirmation} onChange={(e) => updateComposer({ political_mail_alert_confirmation: e.target.value })} />
              <input className="vs-input" placeholder="Political Mail Problem Confirmation #" value={composer.political_mail_issue_confirmation} onChange={(e) => updateComposer({ political_mail_issue_confirmation: e.target.value })} />
              <input className="vs-input" placeholder="Informed Delivery Campaign Name" value={composer.informed_delivery_campaign_name} onChange={(e) => updateComposer({ informed_delivery_campaign_name: e.target.value })} />
              <input className="vs-input" placeholder="Informed Delivery Campaign ID" value={composer.informed_delivery_campaign_id} onChange={(e) => updateComposer({ informed_delivery_campaign_id: e.target.value })} />
            </div>

            <SectionCard title="Attachments" subtitle="Store file names now. Real file upload storage can be wired next with multer/S3/Render disk.">
              <div className="vs-grid-3">
                <label className="vs-card-muted" style={{ padding: 12 }}>
                  <div className="vs-stat-label">Mail Piece PDF/Image</div>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => updateComposer({ mail_piece_file_name: fileNameFromInput(e) })} />
                  <div style={{ marginTop: 8, fontSize: 12 }}>{composer.mail_piece_file_name || "No file selected"}</div>
                </label>

                <label className="vs-card-muted" style={{ padding: 12 }}>
                  <div className="vs-stat-label">PS Form 3602</div>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => updateComposer({ ps_form_3602_file_name: fileNameFromInput(e) })} />
                  <div style={{ marginTop: 8, fontSize: 12 }}>{composer.ps_form_3602_file_name || "No file selected"}</div>
                </label>

                <label className="vs-card-muted" style={{ padding: 12 }}>
                  <div className="vs-stat-label">PS Form 8125</div>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => updateComposer({ ps_form_8125_file_name: fileNameFromInput(e) })} />
                  <div style={{ marginTop: 8, fontSize: 12 }}>{composer.ps_form_8125_file_name || "No file selected"}</div>
                </label>
              </div>
            </SectionCard>

            <textarea className="vs-textarea" rows={4} placeholder="Operational notes" value={composer.note} onChange={(e) => updateComposer({ note: e.target.value })} />

            <div className="vs-inline-actions">
              <button type="submit" className="vs-button vs-button-primary" disabled={creatingEvent}>
                {creatingEvent ? "Creating..." : "Create Mail Job"}
              </button>
              <a className="vs-button vs-button-secondary" href={USPS_INFORMED_DELIVERY_CAMPAIGN_URL} target="_blank" rel="noreferrer">
                Open Informed Delivery Portal
              </a>
            </div>

            <datalist id="mailops-assigned-to">
              {(mailOpsOptions.assigned_to || []).map((value) => <option key={value} value={value} />)}
            </datalist>

            <datalist id="mailops-print-vendors">
              {(mailOpsOptions.print_vendors || []).map((value) => <option key={value} value={value} />)}
            </datalist>

            <datalist id="mailops-permit-numbers">
              {(mailOpsOptions.permit_numbers || []).map((value) => <option key={value} value={value} />)}
            </datalist>

            <datalist id="mailops-crids">
              {(mailOpsOptions.crids || []).map((value) => <option key={value} value={value} />)}
            </datalist>

            <datalist id="mailops-mids">
              {(mailOpsOptions.mids || []).map((value) => <option key={value} value={value} />)}
            </datalist>

            <datalist id="mailops-organizations">
              {(mailOpsOptions.organizations || []).map((value) => <option key={value} value={value} />)}
            </datalist>

            <datalist id="mailops-organization-addresses">
              {(mailOpsOptions.organization_addresses || []).map((value) => <option key={value} value={value} />)}
            </datalist>

            <datalist id="mailops-induction-facilities">
              {inductionFacilities.map((item) => (
                <option key={`${item.facility_type}-${item.name}-${item.address}`} value={item.name}>
                  {item.address}
                </option>
              ))}
            </datalist>

            <datalist id="mailops-scf-list">
              {(mailOpsOptions.scfs || []).map((item) => (
                <option key={`${item.name}-${item.address}`} value={item.name}>
                  {item.address}
                </option>
              ))}
            </datalist>

            <datalist id="mailops-scf-addresses">
              {(mailOpsOptions.scfs || []).map((item) => (
                <option key={`${item.address}-${item.name}`} value={item.address}>
                  {item.name}
                </option>
              ))}
            </datalist>

            <datalist id="mailops-ndc-list">
              {(mailOpsOptions.ndcs || []).map((item) => (
                <option key={`${item.name}-${item.address}`} value={item.name}>
                  {item.address}
                </option>
              ))}
            </datalist>

            <datalist id="mailops-ndc-addresses">
              {(mailOpsOptions.ndcs || []).map((item) => (
                <option key={`${item.address}-${item.name}`} value={item.address}>
                  {item.name}
                </option>
              ))}
            </datalist>
          </form>
        ) : null}
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard title="Active Mail Jobs" subtitle="Live campaign mail jobs, postal induction posture, and in-home timing." right={<Badge tone={isDemoData ? "demo" : "active"}>{isDemoData ? "Demo Data" : "Live Data"}</Badge>}>
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading mail jobs..." /> : !drops.length ? <EmptyState text="No active mail jobs available." /> : drops.map((row) => <DropRow key={row.id || row.job_number || row.campaign} row={row} />)}
          </div>
        </SectionCard>

        <SectionCard title="Postal Intelligence Alerts" subtitle="Risk signals that may affect SCF arrival or in-home timing.">
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading postal alerts..." /> : !alerts.length ? <EmptyState text="No postal alerts available." /> : alerts.map((row) => <AlertRow key={row.id || row.title} row={row} />)}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Vendor / Postal Facility Intelligence" subtitle="BMEU, SCF, NDC, DDU and vendor rollups from currently tracked jobs.">
        <div className="vs-grid-4">
          <StatCard label="Total Pieces" value={totalPieces.toLocaleString()} delta="Tracked quantity" tone="up" />
          <StatCard label="SCF Arrival Rate" value={pct(scfArrived, events.length)} delta={`${scfArrived} arrived`} tone="up" />
          <StatCard label="High Alerts" value={highAlerts} delta="Postal risk signals" tone={highAlerts ? "down" : "up"} />
          <StatCard label="Postal Facilities" value={(mailOpsOptions.facilities || []).length} delta="BMEU / SCF / NDC / DDU" tone="up" />
        </div>
      </SectionCard>

      <SectionCard title="MailOps Job Queue" subtitle="Update confirmation numbers, Informed Delivery campaign IDs, job status, severity, actual SCF arrival, actual in-home date, and operational notes.">
        <div className="vs-stack">
          {loadingEvents ? (
            <EmptyState text="Loading MailOps jobs..." />
          ) : !events.length ? (
            <EmptyState text="No MailOps jobs available." />
          ) : (
            events.map((row) => (
              <EventRow
                key={row.id}
                row={row}
                draft={eventDrafts[row.id] || {
                  status: row.status || "Pending",
                  severity: row.severity || "Medium",
                  note: row.note || "",
                  actual_scf_arrival_date: row.actual_scf_arrival_date || "",
                  actual_in_home_date: row.actual_in_home_date || "",
                  political_mail_alert_confirmation: row.political_mail_alert_confirmation || "",
                  political_mail_issue_confirmation: row.political_mail_issue_confirmation || "",
                  informed_delivery_campaign_name: row.informed_delivery_campaign_name || "",
                  informed_delivery_campaign_id: row.informed_delivery_campaign_id || "",
                }}
                onDraftChange={handleDraftChange}
                onSave={handleSaveEvent}
                saving={savingEventId === row.id}
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}

