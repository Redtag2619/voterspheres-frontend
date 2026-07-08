import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

const PORTAL_SECTIONS = ["reports", "summary", "signals", "workspace"];

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.clients)) return value.clients;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data?.clients)) return value.data.clients;
  if (Array.isArray(value?.data?.results)) return value.data.results;
  return [];
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function portalUrl(token) {
  const origin = window.location.origin;
  return `${origin}/client-portal/${token}`;
}

function accessTone(value = "") {
  const access = String(value || "").toLowerCase();
  if (access === "executive") return "accent";
  if (access === "reports_only") return "info";
  return "active";
}

function ClientForm({ onCreate, saving }) {
  const [form, setForm] = useState({
    client_name: "",
    organization: "",
    email: "",
    workspace_id: "",
    access_level: "standard",
    allowed_sections: ["reports", "summary", "signals", "workspace"],
  });

  function toggle(section) {
    const next = form.allowed_sections.includes(section)
      ? form.allowed_sections.filter((item) => item !== section)
      : [...form.allowed_sections, section];

    setForm({ ...form, allowed_sections: next });
  }

  function submit(event) {
    event.preventDefault();

    onCreate?.({
      ...form,
      workspace_id: form.workspace_id || null,
    });

    setForm({
      client_name: "",
      organization: "",
      email: "",
      workspace_id: "",
      access_level: "standard",
      allowed_sections: ["reports", "summary", "signals", "workspace"],
    });
  }

  return (
    <form className="portal-form" onSubmit={submit}>
      <input
        required
        placeholder="Client name"
        value={form.client_name}
        onChange={(event) => setForm({ ...form, client_name: event.target.value })}
      />

      <input
        placeholder="Organization"
        value={form.organization}
        onChange={(event) => setForm({ ...form, organization: event.target.value })}
      />

      <input
        placeholder="Email"
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
      />

      <input
        placeholder="Workspace ID optional"
        value={form.workspace_id}
        onChange={(event) => setForm({ ...form, workspace_id: event.target.value })}
      />

      <select
        value={form.access_level}
        onChange={(event) => setForm({ ...form, access_level: event.target.value })}
      >
        <option value="standard">Standard</option>
        <option value="executive">Executive</option>
        <option value="reports_only">Reports Only</option>
      </select>

      <div className="portal-checks">
        {PORTAL_SECTIONS.map((section) => (
          <label key={section}>
            <input
              type="checkbox"
              checked={form.allowed_sections.includes(section)}
              onChange={() => toggle(section)}
            />
            {section}
          </label>
        ))}
      </div>

      <button className="vs-button" disabled={saving}>
        {saving ? "Creating..." : "Create Client Portal"}
      </button>
    </form>
  );
}

function ClientPortalExecutiveHeader({
  summary,
  loading,
  saving,
  lastUpdated,
  onRefresh,
}) {
  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        72 +
          Math.min(14, summary.active * 3) +
          Math.min(10, summary.viewed * 2) -
          Math.min(18, summary.revoked * 3) -
          (loading ? 6 : 0) -
          (saving ? 4 : 0)
      )
    )
  );

  return (
    <div className="portal-exec-ribbon" id="portal-overview">
      <div className="portal-exec-copy">
        <span>Client Portal Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive client-access center for secure report portals, public summaries,
          signal watch, workspace status, client engagement, access level controls,
          and revocation workflows.
        </p>

        <div className="portal-exec-badges">
          <Badge tone="active">{summary.active} Active</Badge>
          <Badge tone="info">{summary.viewed} Viewed</Badge>
          <Badge tone={summary.revoked ? "demo" : "active"}>{summary.revoked} Revoked</Badge>
          <Badge tone="accent">{summary.total} Total Portals</Badge>
        </div>
      </div>

      <div className="portal-exec-grid">
        <div>
          <span>Total Portals</span>
          <strong>{fmt(summary.total)}</strong>
        </div>
        <div>
          <span>Client Engagement</span>
          <strong>{fmt(summary.viewed)}</strong>
        </div>
        <div>
          <span>Portal Status</span>
          <strong>{loading || saving ? "Working" : "Ready"}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{lastUpdated || "Ready"}</strong>
        </div>
      </div>

      <div className="portal-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Portals"}
        </button>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("portal-create")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          Create Portal
        </button>
        <Link to="/intelligence-reports">Reports</Link>
        <Link to="/mission-control">Mission Control</Link>
        <Link to="/campaign-crm">Campaign CRM</Link>
        <Link to="/command-center">Command Center</Link>
      </div>

      <div className="portal-exec-footer">
        <span>Access model: Reports, summary, signals, workspace</span>
        <span>Client portal route: /client-portal/:token</span>
      </div>
    </div>
  );
}

function PortalExecutiveBrief({ summary, clients }) {
  const latestViewed = clients.find((client) => client.last_viewed_at);
  const activeExecutive = clients.filter(
    (client) =>
      client.status === "active" &&
      String(client.access_level || "").toLowerCase() === "executive"
  ).length;

  return (
    <div className="portal-ai-brief">
      <strong>Executive Client Access Brief</strong>
      <p>
        There are {fmt(summary.total)} total client portals, with {fmt(summary.active)}
        active, {fmt(summary.viewed)} viewed, and {fmt(summary.revoked)} revoked.
        {activeExecutive
          ? ` ${fmt(activeExecutive)} active portal${activeExecutive === 1 ? " has" : "s have"} executive-level access.`
          : " No active executive-level portals are currently visible."}
        {latestViewed
          ? ` Latest engaged client: ${latestViewed.client_name || "Unnamed Client"}.`
          : " No client portal views have been recorded yet."}
      </p>

      <div className="portal-ai-brief-grid">
        <div><span>Active</span><b>{fmt(summary.active)}</b></div>
        <div><span>Viewed</span><b>{fmt(summary.viewed)}</b></div>
        <div><span>Revoked</span><b>{fmt(summary.revoked)}</b></div>
        <div><span>Executive</span><b>{fmt(activeExecutive)}</b></div>
      </div>
    </div>
  );
}

function PortalActionCenter({ loading, onRefresh }) {
  return (
    <div className="portal-action-center">
      <button type="button" onClick={onRefresh} disabled={loading}>
        Refresh Client Portals
      </button>
      <button
        type="button"
        onClick={() =>
          document
            .getElementById("portal-create")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      >
        Create Client Portal
      </button>
      <Link to="/intelligence-reports">Open Intelligence Reports</Link>
      <Link to="/mission-control">Open Mission Control</Link>
      <Link to="/campaign-crm">Open Campaign CRM</Link>
      <Link to="/command-center">Open Command Center</Link>
      <Link to="/ai-war-room">Open AI War Room</Link>
      <Link to="/enterprise-leads">Enterprise Leads</Link>
    </div>
  );
}

export default function ClientPortalAdmin() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.clientPortalClients();
      setClients(arr(result));

      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load client portals."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createClient(payload) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.createClientPortalClient(payload);
      setMessage("Client portal created.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to create client portal."
      );
    } finally {
      setSaving(false);
    }
  }

  async function revokeClient(id) {
    try {
      setError("");
      setMessage("");

      await api.revokeClientPortalClient(id);
      setMessage("Client portal revoked.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to revoke client portal."
      );
    }
  }

  async function copyLink(token) {
    await navigator.clipboard.writeText(portalUrl(token));
    setMessage("Portal link copied.");
  }

  const summary = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((item) => item.status === "active").length,
      revoked: clients.filter((item) => item.status === "revoked").length,
      viewed: clients.filter((item) => item.last_viewed_at).length,
    }),
    [clients]
  );

  const navSections = [
    { id: "portal-overview", label: "Overview" },
    { id: "portal-metrics", label: "Metrics" },
    { id: "portal-create", label: "Create Portal" },
    { id: "portal-list", label: "Client Portals", badge: clients.length },
    { id: "portal-brief", label: "Executive Brief" },
    { id: "portal-actions", label: "Actions" },
  ];

  return (
    <PageShell
      eyebrow="Client Portal"
      title="Client Portal Admin"
      description="Create client-facing portals that expose reports, public summaries, signal watch, and workspace status while hiding internal operations."
      tickerItems={[
        { label: "Active Portals", value: `${summary.active}`, dotClass: "vs-live-dot-success" },
        { label: "Viewed", value: `${summary.viewed}`, dotClass: "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .portal-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .portal-exec-copy { min-width: 0; }

        .portal-exec-copy span,
        .portal-exec-grid span,
        .portal-exec-footer span,
        .portal-ai-brief-grid span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .portal-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .portal-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .portal-exec-badges,
        .portal-exec-actions,
        .portal-exec-footer,
        .portal-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .portal-exec-badges { margin-top: 14px; }

        .portal-exec-grid,
        .portal-ai-brief-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .portal-exec-grid div,
        .portal-ai-brief-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .portal-exec-grid strong,
        .portal-ai-brief-grid b {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .portal-exec-actions,
        .portal-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .portal-exec-actions button,
        .portal-exec-actions a,
        .portal-action-center button,
        .portal-action-center a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .portal-exec-actions button:hover,
        .portal-exec-actions a:hover,
        .portal-action-center button:hover,
        .portal-action-center a:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .portal-exec-actions button:disabled,
        .portal-action-center button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .portal-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .portal-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
          gap: 18px;
          align-items: start;
        }

        .portal-stack { display: grid; gap: 14px; }
        .portal-form { display: grid; gap: 10px; }

        .portal-form input,
        .portal-form select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .portal-checks {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          color: rgba(226, 232, 240, 0.86);
          font-size: 12px;
        }

        .portal-checks label {
          display: flex;
          gap: 6px;
          align-items: center;
          text-transform: capitalize;
        }

        .portal-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          overflow: hidden;
        }

        .portal-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .portal-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .portal-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
        }

        .portal-ai-brief {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .portal-ai-brief strong {
          display: block;
          color: white;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .portal-ai-brief p {
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 14px;
        }

        @media (max-width: 1100px) {
          .portal-grid,
          .portal-exec-ribbon,
          .portal-exec-grid,
          .portal-ai-brief-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="portal-exec-stack">
        <ClientPortalExecutiveHeader
          summary={summary}
          loading={loading}
          saving={saving}
          lastUpdated={lastUpdated}
          onRefresh={load}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="portal-message">{message}</div> : null}

      <CollapsibleSection
        id="portal-metrics"
        title="Client Portal Metrics"
        subtitle="Client access volume, live portals, engagement, and revoked access."
        defaultOpen
        right={<Badge tone="active">{summary.active} Active</Badge>}
      >
        <div className="vs-grid-4">
          <StatCard label="Total Portals" value={fmt(summary.total)} delta="Client access" tone="up" />
          <StatCard label="Active" value={fmt(summary.active)} delta="Currently live" tone="up" />
          <StatCard label="Viewed" value={fmt(summary.viewed)} delta="Client engagement" tone="up" />
          <StatCard label="Revoked" value={fmt(summary.revoked)} delta="Disabled access" tone={summary.revoked ? "neutral" : "up"} />
        </div>
      </CollapsibleSection>

      <div className="portal-grid">
        <CollapsibleSection
          id="portal-create"
          title="Create Client Portal"
          subtitle="Generate a secure client-facing portal link."
          defaultOpen
          right={<Badge tone="accent">Secure Access</Badge>}
        >
          <ClientForm onCreate={createClient} saving={saving} />
        </CollapsibleSection>

        <CollapsibleSection
          id="portal-list"
          title="Client Portals"
          subtitle="Manage client-facing access."
          defaultOpen
          right={<Badge tone="accent">{clients.length}</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading client portals..." />
          ) : !clients.length ? (
            <EmptyState text="No client portals created yet." />
          ) : (
            <ShowMoreList
              items={clients}
              initialCount={10}
              showAllLabel={(count) => `Show All ${count} Client Portals`}
              className="portal-stack"
              renderItem={(client) => (
                <div className="portal-row">
                  <ResponsiveRow
                    title={client.client_name}
                    subtitle={`${client.organization || "No organization"} â€¢ ${client.email || "No email"}`}
                    meta={[
                      { label: "Status", value: client.status },
                      { label: "Access", value: client.access_level },
                      { label: "Workspace", value: client.workspace_id || "Firmwide" },
                      {
                        label: "Viewed",
                        value: client.last_viewed_at
                          ? new Date(client.last_viewed_at).toLocaleDateString()
                          : "Not yet",
                      },
                    ]}
                    right={
                      <div className="portal-actions">
                        <Badge tone={client.status === "active" ? "active" : "danger"}>
                          {client.status}
                        </Badge>
                        <Badge tone={accessTone(client.access_level)}>
                          {client.access_level || "standard"}
                        </Badge>
                        <button
                          type="button"
                          className="vs-button vs-button-secondary"
                          onClick={() => copyLink(client.portal_token)}
                          disabled={!client.portal_token}
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          className="vs-button vs-button-secondary"
                          onClick={() => revokeClient(client.id)}
                          disabled={client.status === "revoked"}
                        >
                          Revoke
                        </button>
                      </div>
                    }
                  />
                </div>
              )}
            />
          )}
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="portal-brief"
        title="Executive Client Access Brief"
        subtitle="Summary of client portal health, access levels, and engagement."
        defaultOpen={false}
        right={<Badge tone={summary.viewed ? "active" : "info"}>{summary.viewed} Viewed</Badge>}
      >
        <PortalExecutiveBrief summary={summary} clients={clients} />
      </CollapsibleSection>

      <CollapsibleSection
        id="portal-actions"
        title="Executive Action Center"
        subtitle="Move client portal workflows into connected VoterSpheres modules."
        defaultOpen={false}
        right={<Badge tone="active">Portal Handoff</Badge>}
      >
        <PortalActionCenter loading={loading} onRefresh={load} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}

