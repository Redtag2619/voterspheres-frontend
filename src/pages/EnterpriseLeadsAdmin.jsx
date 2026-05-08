import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
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

export default function EnterpriseLeadsAdmin() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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

      estimatedRevenue: source.reduce((sum, lead) => {
        const range = String(lead.budget_range || "");

        if (range.includes("$50k")) return sum + 50000;
        if (range.includes("$15k")) return sum + 15000;
        if (range.includes("$5k")) return sum + 5000;
        if (range.includes("$1k")) return sum + 1000;

        return sum;
      }, 0),
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

  function summaryCardStyle(active) {
    return {
      padding: "16px",
      cursor: "pointer",
      border: active ? "1px solid var(--vs-accent, #60a5fa)" : undefined,
      boxShadow: active
        ? "0 0 0 1px rgba(96, 165, 250, 0.2) inset"
        : undefined,
      textAlign: "left",
    };
  }

  return (
    <PageShell
      eyebrow="Enterprise CRM"
      title="Enterprise Leads"
      description="Review enterprise onboarding requests, manage your consultant pipeline, and provision client workspaces."
    >
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          className="vs-card"
          style={summaryCardStyle(summaryFilter === "new")}
          onClick={() => toggleSummaryFilter("new")}
        >
          <div className="vs-stat-label">New</div>
          <div style={styles.statValue}>{summary.newCount}</div>
        </button>

        <button
          type="button"
          className="vs-card"
          style={summaryCardStyle(summaryFilter === "approved")}
          onClick={() => toggleSummaryFilter("approved")}
        >
          <div className="vs-stat-label">Approved</div>
          <div style={styles.statValue}>{summary.approvedCount}</div>
        </button>

        <button
          type="button"
          className="vs-card"
          style={summaryCardStyle(summaryFilter === "invited")}
          onClick={() => toggleSummaryFilter("invited")}
        >
          <div className="vs-stat-label">Invited</div>
          <div style={styles.statValue}>{summary.invitedCount}</div>
        </button>

        <button
          type="button"
          className="vs-card"
          style={summaryCardStyle(summaryFilter === "converted")}
          onClick={() => toggleSummaryFilter("converted")}
        >
          <div className="vs-stat-label">Converted</div>
          <div style={styles.statValue}>{summary.convertedCount}</div>
        </button>

        <button
          type="button"
          className="vs-card"
          style={summaryCardStyle(summaryFilter === "provisioned")}
          onClick={() => toggleSummaryFilter("provisioned")}
        >
          <div className="vs-stat-label">Provisioned</div>
          <div style={styles.statValue}>{summary.provisionedCount}</div>
        </button>

        <div className="vs-card" style={{ padding: "16px" }}>
          <div className="vs-stat-label">Pipeline Value</div>
          <div style={styles.statValue}>
            ${summary.estimatedRevenue?.toLocaleString?.() || 0}
          </div>
        </div>
      </div>

      <SectionCard title="Filters" subtitle="Search and triage enterprise leads.">
        <div className="vs-grid-3">
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
                {stage.replaceAll("_", " ")}
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
      </SectionCard>

      <SectionCard
        title="Lead Queue"
        subtitle="Enterprise onboarding opportunities."
        right={<Badge tone="accent">{filteredLeads.length} leads</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading enterprise leads..." />
          ) : !filteredLeads.length ? (
            <EmptyState text="No enterprise leads found." />
          ) : (
            filteredLeads.map((lead) => {
              const workspaceId = getWorkspaceId(lead);
              const isProvisioning = provisioningLeadId === lead.id;
              const isUpdating = updatingLeadId === lead.id;

              return (
                <div
                  key={lead.id}
                  className="vs-card"
                  style={{
                    padding: "16px",
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <div style={styles.headerRow}>
                    <div>
                      <div style={styles.leadName}>{getLeadName(lead)}</div>

                      <div style={styles.leadMeta}>
                        {getLeadFirm(lead)} • {lead.email || "No email"}
                      </div>
                    </div>

                    <div className="vs-chip-row">
                      <Badge tone={statusTone(lead.status || lead.stage)}>
                        {String(lead.status || lead.stage || "new").replaceAll(
                          "_",
                          " "
                        )}
                      </Badge>

                      {lead.priority ? (
                        <Badge tone={priorityTone(lead.priority)}>
                          {lead.priority}
                        </Badge>
                      ) : null}

                      {workspaceId ? <Badge tone="active">Workspace Ready</Badge> : null}
                    </div>
                  </div>

                  <div style={styles.badgeRow}>
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

                  <div className="vs-grid-3">
                    <div className="vs-card-muted" style={styles.mutedCard}>
                      <div className="vs-stat-label">States</div>
                      <div style={styles.mutedValue}>
                        {Array.isArray(lead.states) && lead.states.length
                          ? lead.states.join(", ")
                          : "N/A"}
                      </div>
                    </div>

                    <div className="vs-card-muted" style={styles.mutedCard}>
                      <div className="vs-stat-label">Budget Range</div>
                      <div style={styles.mutedValue}>
                        {lead.budget_range || "N/A"}
                      </div>
                    </div>

                    <div className="vs-card-muted" style={styles.mutedCard}>
                      <div className="vs-stat-label">Team Size</div>
                      <div style={styles.mutedValue}>{lead.team_size || "N/A"}</div>
                    </div>
                  </div>

                  <div className="vs-grid-2">
                    <div className="vs-card-muted" style={styles.mutedCard}>
                      <div className="vs-stat-label">Source</div>
                      <div style={styles.mutedValue}>{lead.source || "enterprise"}</div>
                    </div>

                    <div className="vs-card-muted" style={styles.mutedCard}>
                      <div className="vs-stat-label">Submitted</div>
                      <div style={styles.mutedValue}>
                        {formatDateTime(lead.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="vs-card-muted" style={styles.mutedCard}>
                    <div className="vs-stat-label">Use Case</div>

                    <div style={styles.useCaseText}>
                      {lead.use_case || lead.message || "No details provided."}
                    </div>
                  </div>

                  <div style={styles.actionsRow}>
                    <select
                      className="vs-select"
                      value={lead.status || lead.stage || "new"}
                      onChange={(event) => handleUpdateLead(lead.id, event.target.value)}
                      disabled={isUpdating || isProvisioning}
                    >
                      {PIPELINE_STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="vs-button"
                      onClick={() => handleUpdateLead(lead.id, "contacted")}
                      disabled={isUpdating || isProvisioning}
                    >
                      Mark Contacted
                    </button>

                    <button
                      type="button"
                      className="vs-button vs-button-secondary"
                      onClick={() => handleApproveLead(lead.id)}
                      disabled={Boolean(lead.is_beta_approved) || isUpdating}
                    >
                      {lead.is_beta_approved ? "Approved" : "Approve"}
                    </button>

                    <button
                      type="button"
                      className="vs-button vs-button-secondary"
                      onClick={() => handleInviteLead(lead.id)}
                      disabled={Boolean(lead.has_converted_user) || isUpdating}
                    >
                      {lead.has_converted_user ? "Converted" : "Send Invite"}
                    </button>

                    <button
                      type="button"
                      className="vs-button vs-button-secondary"
                      onClick={() => handleApproveAndInviteLead(lead.id)}
                      disabled={Boolean(lead.has_converted_user) || isUpdating}
                    >
                      Approve + Invite
                    </button>

                    <button
                      type="button"
                      className="vs-button"
                      onClick={() => handleProvisionWorkspace(lead)}
                      disabled={isProvisioning || Boolean(workspaceId)}
                    >
                      {workspaceId
                        ? "Workspace Provisioned"
                        : isProvisioning
                          ? "Provisioning..."
                          : "Provision Workspace"}
                    </button>

                    {workspaceId ? (
                      <a
                        className="vs-button vs-button-secondary"
                        href={`/campaign-workspace/${workspaceId}`}
                      >
                        Open Workspace
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}

const styles = {
  statValue: {
    marginTop: "8px",
    fontSize: "28px",
    fontWeight: 900,
    color: "var(--vs-text)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  leadName: {
    fontSize: "16px",
    fontWeight: 800,
    color: "var(--vs-text)",
  },
  leadMeta: {
    marginTop: "4px",
    color: "var(--vs-text-muted)",
    fontSize: "13px",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  mutedCard: {
    padding: "12px 14px",
  },
  mutedValue: {
    marginTop: "4px",
    fontWeight: 700,
  },
  useCaseText: {
    marginTop: "6px",
    color: "var(--vs-text)",
  },
  actionsRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
};

