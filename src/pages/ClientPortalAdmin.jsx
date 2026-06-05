import { useCallback, useEffect, useMemo, useState } from "react";
import { api, API_BASE } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.clients)) return value.clients;
  return [];
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function portalUrl(token) {
  const origin = window.location.origin;
  return `${origin}/client-portal/${token}`;
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
      <input required placeholder="Client name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
      <input placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Workspace ID optional" value={form.workspace_id} onChange={(e) => setForm({ ...form, workspace_id: e.target.value })} />

      <select value={form.access_level} onChange={(e) => setForm({ ...form, access_level: e.target.value })}>
        <option value="standard">Standard</option>
        <option value="executive">Executive</option>
        <option value="reports_only">Reports Only</option>
      </select>

      <div className="portal-checks">
        {["reports", "summary", "signals", "workspace"].map((section) => (
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

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load client portals.");
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
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to create client portal.");
    } finally {
      setSaving(false);
    }
  }

  async function revokeClient(id) {
    try {
      setError("");
      await api.revokeClientPortalClient(id);
      setMessage("Client portal revoked.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to revoke client portal.");
    }
  }

  async function copyLink(token) {
    await navigator.clipboard.writeText(portalUrl(token));
    setMessage("Portal link copied.");
  }

  const summary = useMemo(() => ({
    total: clients.length,
    active: clients.filter((item) => item.status === "active").length,
    revoked: clients.filter((item) => item.status === "revoked").length,
    viewed: clients.filter((item) => item.last_viewed_at).length,
  }), [clients]);

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
        .portal-grid { display:grid; grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr); gap:18px; align-items:start; }
        .portal-stack { display:grid; gap:14px; }
        .portal-form { display:grid; gap:10px; }
        .portal-form input, .portal-form select {
          width:100%; border-radius:14px; border:1px solid rgba(148,163,184,.18);
          background:rgba(15,23,42,.74); color:white; padding:11px 12px; outline:none;
        }
        .portal-checks { display:flex; gap:10px; flex-wrap:wrap; color:rgba(226,232,240,.86); font-size:12px; }
        .portal-checks label { display:flex; gap:6px; align-items:center; }
        .portal-row {
          border-radius:20px; border:1px solid rgba(148,163,184,.16);
          background:rgba(15,23,42,.58); overflow:hidden;
        }
        .portal-row .vs-responsive-row { border:0; background:transparent; }
        .portal-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
        .portal-message {
          border-radius:16px; border:1px solid rgba(96,165,250,.24);
          background:rgba(37,99,235,.14); color:rgba(226,232,240,.92); padding:12px;
        }
        @media(max-width:1100px){ .portal-grid{ grid-template-columns:1fr; } }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="portal-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Total Portals" value={fmt(summary.total)} delta="Client access" tone="up" />
        <StatCard label="Active" value={fmt(summary.active)} delta="Currently live" tone="up" />
        <StatCard label="Viewed" value={fmt(summary.viewed)} delta="Client engagement" tone="up" />
        <StatCard label="Revoked" value={fmt(summary.revoked)} delta="Disabled access" tone={summary.revoked ? "neutral" : "up"} />
      </div>

      <div className="portal-grid">
        <SectionCard title="Create Client Portal" subtitle="Generate a secure client-facing portal link.">
          <ClientForm onCreate={createClient} saving={saving} />
        </SectionCard>

        <SectionCard title="Client Portals" subtitle="Manage client-facing access." right={<Badge tone="accent">{clients.length}</Badge>}>
          {loading ? (
            <EmptyState text="Loading client portals..." />
          ) : !clients.length ? (
            <EmptyState text="No client portals created yet." />
          ) : (
            <div className="portal-stack">
              {clients.map((client) => (
                <div key={client.id} className="portal-row">
                  <ResponsiveRow
                    title={client.client_name}
                    subtitle={`${client.organization || "No organization"} • ${client.email || "No email"}`}
                    meta={[
                      { label: "Status", value: client.status },
                      { label: "Access", value: client.access_level },
                      { label: "Workspace", value: client.workspace_id || "Firmwide" },
                      { label: "Viewed", value: client.last_viewed_at ? new Date(client.last_viewed_at).toLocaleDateString() : "Not yet" },
                    ]}
                    right={
                      <div className="portal-actions">
                        <Badge tone={client.status === "active" ? "active" : "danger"}>{client.status}</Badge>
                        <button className="vs-button vs-button-secondary" onClick={() => copyLink(client.portal_token)}>Copy</button>
                        <button className="vs-button vs-button-secondary" onClick={() => revokeClient(client.id)}>Revoke</button>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
