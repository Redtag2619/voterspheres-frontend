import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/ui/PageShell";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import StatCard from "../components/ui/StatCard";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";
import { api } from "../services/api";

const PIPELINE_STAGES = [
  "new",
  "contacted",
  "qualified",
  "demo_scheduled",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
  "archived",
];

const SUMMARY_FILTERS = [
  { key: "new", label: "New" },
  { key: "approved", label: "Approved" },
  { key: "invited", label: "Invited" },
  { key: "converted", label: "Converted" },
  { key: "provisioned", label: "Provisioned" },
];

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function money(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function label(value = "") {
  return String(value || "").replaceAll("_", " ");
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();

  if (value === "won") return "active";
  if (value === "qualified") return "accent";
  if (value === "contacted") return "warning";
  if (value === "archived" || value === "lost") return "default";

  return "info";
}

function lifecycleTone(active) {
  return active ? "active" : "default";
}

function priorityTone(priority) {
  const value = String(priority || "").toLowerCase();

  if (value === "urgent") return "danger";
  if (value === "high") return "danger";
  if (value === "medium") return "accent";

  return "default";
}

function normalizeLead(responseLead = {}) {
  return {
    ...responseLead,
    status: responseLead.status || responseLead.stage || "new",
    stage: responseLead.stage || responseLead.status || "new",
    states: Array.isArray(responseLead.states) ? responseLead.states : [],
  };
}

function getLeadName(lead = {}) {
  return lead.full_name || lead.contact_name || lead.email || "Enterprise Lead";
}

function getLeadFirm(lead = {}) {
  return lead.firm_name || "Enterprise Prospect";
}

function getWorkspaceId(lead = {}) {
  return lead.provisioned_workspace_id || lead.workspace_id || "";
}

function estimateLeadRevenue(lead = {}) {
  const range = String(lead.budget_range || "");

  if (range.includes("$50k")) return 50000;
  if (range.includes("$15k")) return 15000;
  if (range.includes("$5k")) return 5000;
  if (range.includes("$1k")) return 1000;

  return 0;
}

async function fetchLeads(params = {}) {
  if (api.enterpriseLeads) {
    return api.enterpriseLeads(params);
  }

  if (api.get) {
    const response = await api.get("/enterprise-leads/admin", {
      params,
    });

    return response?.data || response;
  }

  return { results: [] };
}

async function patchLead(id, payload) {
  if (api.updateEnterpriseLead) {
    return api.updateEnterpriseLead(id, payload);
  }

  if (api.patch) {
    const response = await api.patch(`/enterprise-leads/admin/${id}`, payload);

    return response?.data || response;
  }

  return {};
}

async function approveLead(id) {
  if (api.post) {
    const response = await api.post(`/enterprise-leads/admin/${id}/approve`);

    return response?.data || response;
  }

  return {};
}

async function inviteLead(id) {
  if (api.post) {
    const response = await api.post(`/enterprise-leads/admin/${id}/invite`);

    return response?.data || response;
  }

  return {};
}

async function approveAndInviteLead(id) {
  if (api.post) {
    const response = await api.post(
      `/enterprise-leads/admin/${id}/approve-and-invite`
    );

    return response?.data || response;
  }

  return {};
}

async function provisionLeadWorkspace(id) {
  if (api.provisionEnterpriseLeadWorkspace) {
    return api.provisionEnterpriseLeadWorkspace(id);
  }

  if (api.post) {
    const response = await api.post(
      `/enterprise-leads/admin/${id}/provision-workspace`,
      {}
    );

    return response?.data || response;
  }

  return {};
}

function EnterpriseLeadsExecutiveHeader({
  summary,
  filteredCount,
  summaryFilter,
  loading,
  lastUpdated,
  onRefresh,
}) {
  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        62 +
          Math.min(12, summary.approvedCount * 2) +
          Math.min(12, summary.invitedCount * 2) +
          Math.min(12, summary.provisionedCount * 4) +
          Math.min(8, summary.convertedCount * 5) -
          Math.min(16, summary.newCount * 0.8) -
          (loading ? 5 : 0)
      )
    )
  );

  return (
    <div className="leads-exec-ribbon" id="leads-overview">
      <div className="leads-exec-copy">
        <span>Enterprise Pipeline Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive pipeline center for enterprise onboarding requests, beta approval,
          invite handoff, workspace provisioning, consultant CRM follow-through, and projected
          pipeline value.
        </p>

        <div className="leads-exec-badges">
          <Badge tone="info">{summary.total} Total Leads</Badge>
          <Badge tone={summary.newCount ? "demo" : "active"}>{summary.newCount} New</Badge>
          <Badge tone="accent">{summary.approvedCount} Approved</Badge>
          <Badge tone="warning">{summary.invitedCount} Invited</Badge>
          <Badge tone="active">{summary.provisionedCount} Provisioned</Badge>
          <Badge tone="active">{money(summary.estimatedRevenue)}</Badge>
        </div>
      </div>

      <div className="leads-exec-grid">
        <div>
          <span>Visible Queue</span>
          <strong>{fmt(filteredCount)}</strong>
        </div>
        <div>
          <span>Active Filter</span>
          <strong>{summaryFilter === "all" ? "All Leads" : label(summaryFilter)}</strong>
        </div>
        <div>
          <span>Pipeline Status</span>
          <strong>{loading ? "Refreshing" : "Ready"}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{lastUpdated || "Ready"}</strong>
        </div>
      </div>

      <div className="leads-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Leads"}
        </button>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("leads-filters")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          Filter Pipeline
        </button>
        <Link to="/client-portal-admin">Client Portal</Link>
        <Link to="/firm-users">Firm Users</Link>
        <Link to="/campaign-crm">Campaign CRM</Link>
        <Link to="/mission-control">Mission Control</Link>
        <Link to="/billing">Billing</Link>
      </div>

      <div className="leads-exec-footer">
        <span>Lifecycle: approve, invite, provision, convert</span>
        <span>Workspace handoff: /campaign-workspace/:id</span>
      </div>
    </div>
  );
}

function PipelineBrief({ summary, leads }) {
  const urgentLeads = leads.filter((lead) =>
    ["urgent", "high"].includes(String(lead.priority || "").toLowerCase())
  );
  const unprovisionedApproved = leads.filter(
    (lead) => Boolean(lead.is_beta_approved) && !Boolean(getWorkspaceId(lead))
  );
  const topLead = [...leads]
    .sort((a, b) => estimateLeadRevenue(b) - estimateLeadRevenue(a))[0];

  return (
    <div className="leads-ai-brief">
      <strong>Executive Pipeline Brief</strong>
      <p>
        The enterprise pipeline contains {fmt(summary.total)} leads with {fmt(summary.newCount)}
        new, {fmt(summary.approvedCount)} approved, {fmt(summary.invitedCount)} invited,
        and {fmt(summary.provisionedCount)} provisioned. Estimated pipeline value is{" "}
        {money(summary.estimatedRevenue)}.
        {urgentLeads.length
          ? ` ${fmt(urgentLeads.length)} high-priority lead${urgentLeads.length === 1 ? "" : "s"} should be reviewed first.`
          : " No urgent lead backlog is currently visible."}
        {unprovisionedApproved.length
          ? ` ${fmt(unprovisionedApproved.length)} approved lead${unprovisionedApproved.length === 1 ? "" : "s"} still need workspace provisioning.`
          : " Approved leads appear provision-ready."}
        {topLead ? ` Highest-value visible opportunity: ${getLeadFirm(topLead)}.` : ""}
      </p>

      <div className="leads-ai-brief-grid">
        <div><span>Pipeline Value</span><b>{money(summary.estimatedRevenue)}</b></div>
        <div><span>High Priority</span><b>{fmt(urgentLeads.length)}</b></div>
        <div><span>Approved Pending Workspace</span><b>{fmt(unprovisionedApproved.length)}</b></div>
        <div><span>Converted</span><b>{fmt(summary.convertedCount)}</b></div>
      </div>
    </div>
  );
}

function PipelineStageGrid({ leads }) {
  return (
    <div className="leads-stage-grid">
      {PIPELINE_STAGES.map((stage) => {
        const count = leads.filter(
          (lead) => String(lead.status || lead.stage || "").toLowerCase() === stage
        ).length;

        return (
          <div key={stage} className="leads-stage-card">
            <span>{label(stage)}</span>
            <strong>{fmt(count)}</strong>
            <Badge tone={statusTone(stage)}>{label(stage)}</Badge>
          </div>
        );
      })}
    </div>
  );
}

function LeadCard({
  lead,
  provisioningLeadId,
  updatingLeadId,
  onUpdateLead,
  onApproveLead,
  onInviteLead,
  onApproveAndInviteLead,
  onProvisionWorkspace,
}) {
  const workspaceId = getWorkspaceId(lead);
  const isProvisioning = provisioningLeadId === lead.id;
  const isUpdating = updatingLeadId === lead.id;
  const status = lead.status || lead.stage || "new";

  return (
    <div className="lead-card">
      <ResponsiveRow
        title={getLeadName(lead)}
        subtitle={`${getLeadFirm(lead)} â€¢ ${lead.email || "No email"}`}
        meta={[
          { label: "Status", value: label(status) },
          { label: "Priority", value: lead.priority || "medium" },
          { label: "States", value: Array.isArray(lead.states) && lead.states.length ? lead.states.join(", ") : "N/A" },
          { label: "Budget", value: lead.budget_range || "N/A" },
          { label: "Team", value: lead.team_size || "N/A" },
          { label: "Submitted", value: formatDateTime(lead.created_at) },
        ]}
        right={
          <div className="lead-badges">
            <Badge tone={statusTone(status)}>{label(status)}</Badge>
            {lead.priority ? <Badge tone={priorityTone(lead.priority)}>{lead.priority}</Badge> : null}
            {workspaceId ? <Badge tone="active">Workspace Ready</Badge> : null}
          </div>
        }
      />

      <div className="lead-lifecycle">
        <Badge tone={lifecycleTone(lead.is_beta_approved)}>
          {lead.is_beta_approved ? "Approved" : "Not Approved"}
        </Badge>
        <Badge tone={lifecycleTone(lead.has_pending_invite)}>
          {lead.has_pending_invite ? "Invited" : "No Invite"}
        </Badge>
        <Badge tone={lifecycleTone(lead.has_converted_user)}>
          {lead.has_converted_user ? "Converted" : "Not Converted"}
        </Badge>
        <Badge tone={lifecycleTone(Boolean(workspaceId))}>
          {workspaceId ? "Provisioned" : "Not Provisioned"}
        </Badge>
      </div>

      <div className="lead-detail-grid">
        <div className="lead-detail">
          <span>Source</span>
          <strong>{lead.source || "enterprise"}</strong>
        </div>
        <div className="lead-detail">
          <span>Use Case</span>
          <strong>{lead.use_case || lead.message || "No details provided."}</strong>
        </div>
      </div>

      <div className="lead-actions">
        <select
          className="vs-select"
          value={status}
          onChange={(event) => onUpdateLead(lead.id, event.target.value)}
          disabled={isUpdating || isProvisioning}
        >
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {label(stage)}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="vs-button"
          onClick={() => onUpdateLead(lead.id, "contacted")}
          disabled={isUpdating || isProvisioning}
        >
          Mark Contacted
        </button>

        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onApproveLead(lead.id)}
          disabled={Boolean(lead.is_beta_approved) || isUpdating}
        >
          {lead.is_beta_approved ? "Approved" : "Approve"}
        </button>

        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onInviteLead(lead.id)}
          disabled={Boolean(lead.has_converted_user) || isUpdating}
        >
          {lead.has_converted_user ? "Converted" : "Send Invite"}
        </button>

        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onApproveAndInviteLead(lead.id)}
          disabled={Boolean(lead.has_converted_user) || isUpdating}
        >
          Approve + Invite
        </button>

        <button
          type="button"
          className="vs-button"
          onClick={() => onProvisionWorkspace(lead)}
          disabled={isProvisioning || Boolean(workspaceId)}
        >
          {workspaceId
            ? "Workspace Provisioned"
            : isProvisioning
              ? "Provisioning..."
              : "Provision Workspace"}
        </button>

        {workspaceId ? (
          <a className="vs-button vs-button-secondary" href={`/campaign-workspace/${workspaceId}`}>
            Open Workspace
          </a>
        ) : null}
      </div>
    </div>
  );
}

function EnterpriseActionCenter({ loading, onRefresh }) {
  return (
    <div className="leads-action-center">
      <button type="button" onClick={onRefresh} disabled={loading}>
        Refresh Enterprise Leads
      </button>
      <button
        type="button"
        onClick={() =>
          document
            .getElementById("leads-filters")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      >
        Review Filters
      </button>
      <Link to="/client-portal-admin">Client Portal Admin</Link>
      <Link to="/firm-users">Firm Users</Link>
      <Link to="/billing">Billing</Link>
      <Link to="/campaign-crm">Campaign CRM</Link>
      <Link to="/mission-control">Mission Control</Link>
      <Link to="/command-center">Command Center</Link>
      <Link to="/ai-war-room">AI War Room</Link>
    </div>
  );
}

export default function EnterpriseLeadsAdmin() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [provisioningLeadId, setProvisioningLeadId] = useState(null);
  const [updatingLeadId, setUpdatingLeadId] = useState(null);

  const [filters, setFilters] = useState({
    status: "",
    q: "",
  });

  const [summaryFilter, setSummaryFilter] = useState("all");

  const filteredLeads = useMemo(() => {
    const base = leads || [];

    switch (summaryFilter) {
      case "new":
        return base.filter(
          (lead) => String(lead.status || lead.stage || "").toLowerCase() === "new"
        );

      case "approved":
        return base.filter((lead) => Boolean(lead.is_beta_approved));

      case "invited":
        return base.filter((lead) => Boolean(lead.has_pending_invite));

      case "converted":
        return base.filter((lead) => Boolean(lead.has_converted_user));

      case "provisioned":
        return base.filter((lead) => Boolean(getWorkspaceId(lead)));

      default:
        return base;
    }
  }, [leads, summaryFilter]);

  const summary = useMemo(() => {
    const source = leads || [];

    return {
      total: source.length,
      newCount: source.filter(
        (lead) => String(lead.status || lead.stage || "").toLowerCase() === "new"
      ).length,
      approvedCount: source.filter((lead) => Boolean(lead.is_beta_approved)).length,
      invitedCount: source.filter((lead) => Boolean(lead.has_pending_invite)).length,
      convertedCount: source.filter((lead) => Boolean(lead.has_converted_user)).length,
      provisionedCount: source.filter((lead) => Boolean(getWorkspaceId(lead))).length,
      estimatedRevenue: source.reduce((sum, lead) => sum + estimateLeadRevenue(lead), 0),
    };
  }, [leads]);

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetchLeads({
        status: filters.status || "",
        q: filters.q || "",
      });

      const rows =
        response?.results ||
        response?.data?.results ||
        response?.items ||
        response?.rows ||
        [];

      setLeads(rows.map(normalizeLead));
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load enterprise leads"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.q]);

  async function handleUpdateLead(id, status) {
    try {
      setError("");
      setMessage("");
      setUpdatingLeadId(id);

      await patchLead(id, {
        status,
        stage: status,
        review_notes: `Updated to ${status} from enterprise CRM dashboard`,
      });

      setMessage("Lead updated.");
      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Failed to update lead"
      );
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function handleApproveLead(id) {
    try {
      setError("");
      setMessage("");
      setUpdatingLeadId(id);

      await approveLead(id);

      setMessage("Lead approved.");
      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Failed to approve lead"
      );
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function handleInviteLead(id) {
    try {
      setError("");
      setMessage("");
      setUpdatingLeadId(id);

      const response = await inviteLead(id);

      if (response?.email_sent) {
        setMessage("Invite sent successfully.");
      } else if (response?.invite_link) {
        setMessage(`Invite created. Share manually: ${response.invite_link}`);
      } else {
        setMessage("Invite created.");
      }

      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Failed to invite lead"
      );
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function handleApproveAndInviteLead(id) {
    try {
      setError("");
      setMessage("");
      setUpdatingLeadId(id);

      const response = await approveAndInviteLead(id);

      if (response?.email_sent) {
        setMessage("Lead approved and invite sent.");
      } else if (response?.invite_link) {
        setMessage(`Lead approved and invite created: ${response.invite_link}`);
      } else {
        setMessage("Lead approved.");
      }

      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to approve and invite lead"
      );
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function handleProvisionWorkspace(lead) {
    try {
      setError("");
      setMessage("");
      setProvisioningLeadId(lead.id);

      const response = await provisionLeadWorkspace(lead.id);

      if (response?.alreadyProvisioned) {
        setMessage("Workspace was already provisioned for this lead.");
      } else {
        setMessage("Enterprise workspace provisioned successfully.");
      }

      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to provision enterprise workspace."
      );
    } finally {
      setProvisioningLeadId(null);
    }
  }

  function toggleSummaryFilter(key) {
    setSummaryFilter((current) => (current === key ? "all" : key));
  }

  const navSections = [
    { id: "leads-overview", label: "Overview" },
    { id: "leads-metrics", label: "Metrics" },
    { id: "leads-filters", label: "Filters" },
    { id: "leads-queue", label: "Lead Queue", badge: filteredLeads.length },
    { id: "leads-intelligence", label: "Intelligence" },
    { id: "leads-actions", label: "Actions" },
  ];

  return (
    <PageShell
      eyebrow="Enterprise CRM"
      title="Enterprise Leads"
      description="Review enterprise onboarding requests, manage your consultant pipeline, and provision client workspaces."
      tickerItems={[
        { label: "Leads", value: `${summary.total}`, dotClass: "vs-live-dot-success" },
        { label: "Approved", value: `${summary.approvedCount}`, dotClass: "vs-live-dot-success" },
        { label: "Provisioned", value: `${summary.provisionedCount}`, dotClass: "vs-live-dot-success" },
        { label: "Value", value: money(summary.estimatedRevenue), dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .leads-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.13), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .leads-exec-copy { min-width: 0; }

        .leads-exec-copy span,
        .leads-exec-grid span,
        .leads-exec-footer span,
        .leads-ai-brief-grid span,
        .leads-stage-card span,
        .lead-detail span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .leads-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .leads-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .leads-exec-badges,
        .leads-exec-actions,
        .leads-exec-footer,
        .leads-action-center,
        .lead-badges,
        .lead-lifecycle,
        .lead-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .leads-exec-badges { margin-top: 14px; }

        .leads-exec-grid,
        .leads-ai-brief-grid,
        .lead-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .leads-exec-grid div,
        .leads-ai-brief-grid div,
        .leads-stage-card,
        .lead-detail {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .leads-exec-grid strong,
        .leads-ai-brief-grid b,
        .leads-stage-card strong,
        .lead-detail strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .lead-detail strong {
          font-size: 13px;
          line-height: 1.55;
          font-weight: 750;
        }

        .leads-exec-actions,
        .leads-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .leads-exec-actions button,
        .leads-exec-actions a,
        .leads-action-center button,
        .leads-action-center a {
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

        .leads-exec-actions button:hover,
        .leads-exec-actions a:hover,
        .leads-action-center button:hover,
        .leads-action-center a:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .leads-exec-actions button:disabled,
        .leads-action-center button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .leads-exec-stack,
        .leads-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .leads-filter-grid {
          display: grid;
          grid-template-columns: minmax(160px, 0.35fr) minmax(220px, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .leads-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .leads-summary-button {
          text-align: left;
          cursor: pointer;
          border: 1px solid rgba(148, 163, 184, 0.15);
          background: rgba(15, 23, 42, 0.62);
        }

        .leads-summary-button.is-active {
          border-color: rgba(96, 165, 250, 0.7);
          box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.22) inset;
        }

        .lead-card {
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          overflow: hidden;
        }

        .lead-card .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .lead-lifecycle,
        .lead-detail-grid,
        .lead-actions {
          padding: 0 16px 14px;
        }

        .lead-actions {
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .lead-actions .vs-select {
          min-width: 190px;
        }

        .leads-ai-brief {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .leads-ai-brief strong {
          display: block;
          color: white;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .leads-ai-brief p {
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 14px;
        }

        .leads-stage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
        }

        .leads-stage-card {
          display: grid;
          gap: 8px;
          align-content: start;
        }

        @media (max-width: 1100px) {
          .leads-exec-ribbon,
          .leads-exec-grid,
          .leads-ai-brief-grid,
          .lead-detail-grid,
          .leads-filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="leads-exec-stack">
        <EnterpriseLeadsExecutiveHeader
          summary={summary}
          filteredCount={filteredLeads.length}
          summaryFilter={summaryFilter}
          loading={loading}
          lastUpdated={lastUpdated}
          onRefresh={loadLeads}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      {message ? (
        <div
          className="vs-banner"
          style={{
            borderColor: "#bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          {message}
        </div>
      ) : null}

      <CollapsibleSection
        id="leads-metrics"
        title="Pipeline Metrics"
        subtitle="Clickable executive summary filters for the enterprise pipeline."
        defaultOpen
        right={<Badge tone="active">{money(summary.estimatedRevenue)}</Badge>}
      >
        <div className="vs-grid-4">
          <StatCard label="Total Leads" value={fmt(summary.total)} delta="Enterprise pipeline" tone="up" />
          <StatCard label="Approved" value={fmt(summary.approvedCount)} delta="Beta/onboarding approved" tone="up" />
          <StatCard label="Provisioned" value={fmt(summary.provisionedCount)} delta="Workspace ready" tone="up" />
          <StatCard label="Pipeline Value" value={money(summary.estimatedRevenue)} delta="Estimated value" tone="up" />
        </div>

        <div className="leads-summary-grid" style={{ marginTop: 14 }}>
          {SUMMARY_FILTERS.map((item) => {
            const value =
              item.key === "new"
                ? summary.newCount
                : item.key === "approved"
                  ? summary.approvedCount
                  : item.key === "invited"
                    ? summary.invitedCount
                    : item.key === "converted"
                      ? summary.convertedCount
                      : summary.provisionedCount;

            return (
              <button
                key={item.key}
                type="button"
                className={`vs-card leads-summary-button ${summaryFilter === item.key ? "is-active" : ""}`}
                onClick={() => setSummaryFilter((current) => (current === item.key ? "all" : item.key))}
              >
                <div className="vs-stat-label">{item.label}</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 950, color: "var(--vs-text)" }}>
                  {fmt(value)}
                </div>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="leads-filters"
        title="Filters"
        subtitle="Search and triage enterprise leads."
        defaultOpen
        right={<Badge tone="info">{summaryFilter === "all" ? "All" : label(summaryFilter)}</Badge>}
      >
        <div className="leads-filter-grid">
          <select
            className="vs-select"
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value,
              }))
            }
          >
            <option value="">All statuses</option>

            {PIPELINE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {label(stage)}
              </option>
            ))}
          </select>

          <input
            className="vs-input"
            value={filters.q}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                q: event.target.value,
              }))
            }
            placeholder="Search by name, firm, email..."
          />

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => {
              setFilters({
                status: "",
                q: "",
              });

              setSummaryFilter("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="leads-queue"
        title="Lead Queue"
        subtitle="Enterprise onboarding opportunities."
        defaultOpen
        right={<Badge tone="accent">{filteredLeads.length} leads</Badge>}
      >
        {loading ? (
          <EmptyState text="Loading enterprise leads..." />
        ) : !filteredLeads.length ? (
          <EmptyState text="No enterprise leads found." />
        ) : (
          <ShowMoreList
            items={filteredLeads}
            initialCount={8}
            showAllLabel={(count) => `Show All ${count} Enterprise Leads`}
            className="leads-stack"
            renderItem={(lead) => (
              <LeadCard
                lead={lead}
                provisioningLeadId={provisioningLeadId}
                updatingLeadId={updatingLeadId}
                onUpdateLead={handleUpdateLead}
                onApproveLead={handleApproveLead}
                onInviteLead={handleInviteLead}
                onApproveAndInviteLead={handleApproveAndInviteLead}
                onProvisionWorkspace={handleProvisionWorkspace}
              />
            )}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="leads-intelligence"
        title="Executive Pipeline Intelligence"
        subtitle="Stage distribution, conversion posture, provisioning readiness, and high-value pipeline assessment."
        defaultOpen={false}
        right={<Badge tone="active">{summary.provisionedCount} Provisioned</Badge>}
      >
        <div className="leads-stack">
          <PipelineStageGrid leads={leads} />
          <PipelineBrief summary={summary} leads={leads} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="leads-actions"
        title="Executive Action Center"
        subtitle="Move enterprise pipeline activity into connected VoterSpheres modules."
        defaultOpen={false}
        right={<Badge tone="active">Pipeline Handoff</Badge>}
      >
        <EnterpriseActionCenter loading={loading} onRefresh={loadLeads} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}

