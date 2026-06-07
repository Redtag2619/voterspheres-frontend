import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high", "blocked", "overdue", "at risk"].some((x) => v.includes(x))) return "danger";
  if (["watch", "medium", "elevated", "open", "pending"].some((x) => v.includes(x))) return "demo";
  if (["stable", "active", "complete", "completed"].some((x) => v.includes(x))) return "active";
  return "accent";
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

export default function ExecutiveWorkspace() {
  const [workspaceId, setWorkspaceId] = useState(() => localStorage.getItem("vs_active_workspace") || "");
  const [data, setData] = useState({
    selected_workspace: null,
    workspaces: [],
    summary: {},
    executive_actions: [],
    signals: [],
    tasks: [],
    contacts: [],
    activities: [],
    reports: [],
    vendors: [],
    clients: [],
    invoices: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.executiveWorkspaceDashboard(workspaceId || undefined);

      setData({
        selected_workspace: result?.selected_workspace || null,
        workspaces: arr(result?.workspaces),
        summary: result?.summary || {},
        executive_actions: arr(result?.executive_actions),
        signals: arr(result?.signals),
        tasks: arr(result?.tasks),
        contacts: arr(result?.contacts),
        activities: arr(result?.activities),
        reports: arr(result?.reports),
        vendors: arr(result?.vendors),
        clients: arr(result?.clients),
        invoices: arr(result?.invoices),
      });

      if (result?.selected_workspace?.id) {
        localStorage.setItem("vs_active_workspace", String(result.selected_workspace.id));
        setWorkspaceId(String(result.selected_workspace.id));
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load Executive Workspace.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = data.selected_workspace;
  const summary = data.summary || {};
  const actions = arr(data.executive_actions);

  const workspaceOptions = useMemo(() => arr(data.workspaces), [data.workspaces]);

  function handleWorkspaceChange(nextId) {
    setWorkspaceId(nextId);
    if (nextId) localStorage.setItem("vs_active_workspace", String(nextId));
  }

  return (
    <PageShell
      eyebrow="Executive Workspace System"
      title={selected ? selected.name : "Executive Workspace"}
      description="One workspace command hub connecting campaign intelligence, CRM, tasks, War Room, reports, vendors, revenue, clients, graph intelligence, and AI."
      tickerItems={[
        { label: "Pressure", value: summary.pressure_status || "Stable", dotClass: summary.pressure_score >= 70 ? "vs-live-dot" : summary.pressure_score >= 40 ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Open Tasks", value: `${summary.open_tasks || 0}`, dotClass: summary.open_tasks ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Signals", value: `${summary.critical_signals || 0}`, dotClass: summary.critical_signals ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .workspace-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
        }

        .workspace-select {
          display: grid;
          grid-template-columns: 160px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
        }

        .workspace-select label {
          color: rgba(148, 163, 184, .86);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .workspace-select select {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .78);
          color: white;
          padding: 11px 12px;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, .75fr);
          gap: 18px;
          align-items: start;
        }

        .workspace-stack {
          display: grid;
          gap: 14px;
        }

        .workspace-command-card {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .16), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .86));
          padding: 22px;
          box-shadow: 0 18px 60px rgba(0,0,0,.28);
        }

        .workspace-command-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .workspace-command-title {
          margin: 0;
          color: white;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -.06em;
          line-height: 1;
        }

        .workspace-command-sub {
          margin-top: 10px;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.6;
        }

        .workspace-pressure {
          margin-top: 18px;
          color: white;
          font-size: 72px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .workspace-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .workspace-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .workspace-mini-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, .14);
          background: rgba(2, 6, 23, .38);
          padding: 12px;
        }

        .workspace-mini-grid span {
          display: block;
          color: rgba(203, 213, 225, .62);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .workspace-mini-grid strong {
          display: block;
          margin-top: 6px;
          color: white;
          font-size: 22px;
          font-weight: 950;
        }

        .workspace-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .workspace-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .workspace-grid,
          .workspace-mini-grid,
          .workspace-toolbar,
          .workspace-select {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <SectionCard title="Workspace Selector" subtitle="Choose the campaign workspace that should drive this command view.">
        <div className="workspace-toolbar">
          <div className="workspace-select">
            <label>Active workspace</label>
            <select value={workspaceId} onChange={(event) => handleWorkspaceChange(event.target.value)}>
              <option value="">Most recent workspace</option>
              {workspaceOptions.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} • {workspace.state} • {workspace.office} • {workspace.cycle}
                </option>
              ))}
            </select>
          </div>

          <button className="vs-button" onClick={() => load({ quiet: true })}>
            {refreshing ? "Refreshing..." : "Refresh Workspace"}
          </button>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        <StatCard label="Pressure Score" value={`${summary.pressure_score || 0}%`} delta={summary.pressure_status || "Stable"} tone={summary.pressure_score >= 70 ? "down" : "up"} />
        <StatCard label="Open Tasks" value={summary.open_tasks || 0} delta="Workspace execution" tone={summary.open_tasks ? "neutral" : "up"} />
        <StatCard label="Critical Signals" value={summary.critical_signals || 0} delta="Political intelligence" tone={summary.critical_signals ? "down" : "up"} />
        <StatCard label="Receivables" value={money(summary.open_receivables)} delta="Client/revenue watch" tone={summary.open_receivables ? "neutral" : "up"} />
      </div>

      {loading ? (
        <EmptyState text="Loading Executive Workspace..." />
      ) : (
        <div className="workspace-grid">
          <div className="workspace-stack">
            <div className="workspace-command-card">
              <div className="workspace-command-top">
                <div>
                  <h2 className="workspace-command-title">{selected?.name || "Workspace Command View"}</h2>
                  <div className="workspace-command-sub">
                    {(selected?.state || "National")} • {(selected?.office || "Campaign")} • {(selected?.cycle || "Cycle")} • Connected operating view.
                  </div>
                </div>
                <Badge tone={tone(summary.pressure_status)}>{summary.pressure_status || "Stable"}</Badge>
              </div>

              <div className="workspace-pressure">{summary.pressure_score || 0}%</div>

              <div className="workspace-mini-grid">
                <div><span>CRM Contacts</span><strong>{summary.crm_contacts || 0}</strong></div>
                <div><span>Activities</span><strong>{summary.open_activities || 0}</strong></div>
                <div><span>Reports</span><strong>{summary.reports || 0}</strong></div>
                <div><span>Vendors</span><strong>{summary.vendors || 0}</strong></div>
              </div>

              <div className="workspace-actions">
                <Link className="vs-button" to="/campaign-crm">CRM</Link>
                <Link className="vs-button vs-button-secondary" to="/war-room">War Room</Link>
                <Link className="vs-button vs-button-secondary" to="/political-intelligence">Graph</Link>
                <Link className="vs-button vs-button-secondary" to="/campaign-copilot">AI Co-Pilot</Link>
                <Link className="vs-button vs-button-secondary" to="/intelligence-reports">Reports</Link>
                <Link className="vs-button vs-button-secondary" to="/revenue-intelligence">Revenue</Link>
              </div>
            </div>

            <SectionCard title="Executive Actions" subtitle="Highest-priority cross-system actions for this workspace." right={<Badge tone={actions.length ? "demo" : "active"}>{actions.length}</Badge>}>
              <div className="workspace-stack">
                {!actions.length ? (
                  <EmptyState text="No executive actions detected for this workspace." />
                ) : (
                  actions.map((item) => (
                    <div key={item.id} className="workspace-row">
                      <ResponsiveRow
                        title={item.title}
                        subtitle={item.detail}
                        meta={[
                          { label: "Source", value: item.source },
                          { label: "Priority", value: item.priority },
                          { label: "Path", value: item.path },
                          { label: "Workspace", value: selected?.name || "Current" },
                        ]}
                        right={<Link className="vs-button vs-button-secondary" to={item.path}>Open</Link>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Political Signals" subtitle="Signals connected by workspace or state context." right={<Badge tone={data.signals.length ? "danger" : "active"}>{data.signals.length}</Badge>}>
              <div className="workspace-stack">
                {!data.signals.length ? <EmptyState text="No signals found." /> : data.signals.slice(0, 8).map((signal) => (
                  <div key={signal.id} className="workspace-row">
                    <ResponsiveRow
                      title={signal.title || "Political Signal"}
                      subtitle={signal.summary || "Signal detail unavailable."}
                      meta={[
                        { label: "State", value: signal.state || "National" },
                        { label: "Type", value: signal.signal_type || "Signal" },
                        { label: "Risk", value: signal.risk || signal.severity || "Stable" },
                        { label: "Score", value: signal.signal_score || 0 },
                      ]}
                      right={<Badge tone={tone(signal.risk || signal.severity)}>{signal.risk || signal.severity || "Signal"}</Badge>}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Tasks" subtitle="Execution items associated with this workspace." right={<Badge tone={data.tasks.length ? "info" : "active"}>{data.tasks.length}</Badge>}>
              <div className="workspace-stack">
                {!data.tasks.length ? <EmptyState text="No tasks found." /> : data.tasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="workspace-row">
                    <ResponsiveRow
                      title={task.title || "Task"}
                      subtitle={task.description || "No task description."}
                      meta={[
                        { label: "Status", value: task.status || "Open" },
                        { label: "Priority", value: task.priority || "Normal" },
                        { label: "State", value: task.state || "National" },
                        { label: "Updated", value: formatDate(task.updated_at || task.created_at) },
                      ]}
                      right={<Badge tone={tone(task.priority || task.status)}>{task.status || "Open"}</Badge>}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="workspace-stack">
            <SectionCard title="CRM Contacts" subtitle="People and organizations connected to this workspace." right={<Badge tone="accent">{data.contacts.length}</Badge>}>
              <div className="workspace-stack">
                {!data.contacts.length ? <EmptyState text="No CRM contacts found." /> : data.contacts.slice(0, 8).map((contact) => (
                  <div key={contact.id} className="workspace-row">
                    <ResponsiveRow
                      title={contact.full_name || "CRM Contact"}
                      subtitle={contact.organization || "No organization"}
                      meta={[
                        { label: "Role", value: contact.role_type || "Contact" },
                        { label: "State", value: contact.state || "National" },
                        { label: "Updated", value: formatDate(contact.updated_at || contact.created_at) },
                        { label: "Workspace", value: contact.workspace_id || "—" },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Reports" subtitle="Workspace or state-level intelligence deliverables." right={<Badge tone="accent">{data.reports.length}</Badge>}>
              <div className="workspace-stack">
                {!data.reports.length ? <EmptyState text="No reports found." /> : data.reports.slice(0, 8).map((report) => (
                  <div key={report.id} className="workspace-row">
                    <ResponsiveRow
                      title={report.title || "Report"}
                      subtitle={report.report_type || "Intelligence report"}
                      meta={[
                        { label: "State", value: report.state || "National" },
                        { label: "Status", value: report.status || "Generated" },
                        { label: "Created", value: formatDate(report.created_at) },
                        { label: "Type", value: report.report_type || "Report" },
                      ]}
                      right={<Badge tone="info">{report.status || "Report"}</Badge>}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Vendor Coverage" subtitle="Vendor and consultant coverage tied to this workspace state." right={<Badge tone={summary.vendor_gaps ? "danger" : "active"}>{summary.vendor_gaps || 0} gaps</Badge>}>
              <div className="workspace-stack">
                {!data.vendors.length ? <EmptyState text="No vendors found." /> : data.vendors.slice(0, 8).map((vendor) => (
                  <div key={vendor.id} className="workspace-row">
                    <ResponsiveRow
                      title={vendor.name || vendor.vendor_name || "Vendor"}
                      subtitle={`${vendor.category || "Vendor"} • ${vendor.state || "National"}`}
                      meta={[
                        { label: "Status", value: vendor.status || "Active" },
                        { label: "Risk", value: vendor.risk || vendor.coverage_tier || "Stable" },
                        { label: "Category", value: vendor.category || "—" },
                        { label: "Updated", value: formatDate(vendor.updated_at || vendor.created_at) },
                      ]}
                      right={<Badge tone={tone(vendor.risk || vendor.coverage_tier)}>{vendor.risk || vendor.coverage_tier || "Vendor"}</Badge>}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Clients / Revenue" subtitle="Client health and revenue records connected by state context." right={<Badge tone={summary.at_risk_clients ? "danger" : "active"}>{data.clients.length}</Badge>}>
              <div className="workspace-stack">
                {!data.clients.length ? <EmptyState text="No clients found." /> : data.clients.slice(0, 8).map((client) => (
                  <div key={client.id} className="workspace-row">
                    <ResponsiveRow
                      title={client.client_name || "Client"}
                      subtitle={client.organization || "Client account"}
                      meta={[
                        { label: "State", value: client.state || "National" },
                        { label: "Status", value: client.status || "Active" },
                        { label: "Health", value: client.health_status || "Stable" },
                        { label: "Retainer", value: money(client.monthly_retainer) },
                      ]}
                      right={<Badge tone={tone(client.health_status)}>{client.health_status || "Client"}</Badge>}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
