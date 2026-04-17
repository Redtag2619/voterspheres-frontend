import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { api } from "../services/api";

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "won") return "active";
  if (value === "qualified") return "accent";
  if (value === "contacted") return "warning";
  if (value === "archived") return "default";
  return "info";
}

function lifecycleTone(active) {
  return active ? "active" : "default";
}

export default function EnterpriseLeadsAdmin() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    q: ""
  });

  const visibleLeads = useMemo(() => leads || [], [leads]);

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/enterprise-leads-admin", {
        params: {
          status: filters.status || "",
          q: filters.q || ""
        }
      });

      setLeads(response?.data?.results || []);
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
  }, [filters.status, filters.q]);

  async function handleUpdateLead(id, status) {
    try {
      setError("");
      setMessage("");

      await api.patch(`/enterprise-leads-admin/${id}`, {
        status,
        review_notes: `Updated to ${status} from admin enterprise dashboard`
      });

      setMessage("Lead updated.");
      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to update lead"
      );
    }
  }

  async function handleApproveLead(id) {
    try {
      setError("");
      setMessage("");

      await api.post(`/enterprise-leads-admin/${id}/approve`);

      setMessage("Lead approved for beta access.");
      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to approve lead"
      );
    }
  }

  async function handleInviteLead(id) {
    try {
      setError("");
      setMessage("");

      const response = await api.post(`/enterprise-leads-admin/${id}/invite`);

      if (response?.data?.email_sent) {
        setMessage("Invite sent successfully.");
      } else if (response?.data?.invite_link) {
        setMessage(
          `Invite created. Email not sent because SMTP is not configured. Share this link manually: ${response.data.invite_link}`
        );
      } else {
        setMessage("Invite created.");
      }

      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to invite lead"
      );
    }
  }

  async function handleApproveAndInviteLead(id) {
    try {
      setError("");
      setMessage("");

      const response = await api.post(`/enterprise-leads-admin/${id}/approve-and-invite`);

      if (response?.data?.email_sent) {
        setMessage("Lead approved and invite sent.");
      } else if (response?.data?.invite_link) {
        setMessage(
          `Lead approved and invite created. Email not sent because SMTP is not configured. Share this link manually: ${response.data.invite_link}`
        );
      } else {
        setMessage("Lead approved and invite workflow completed.");
      }

      await loadLeads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to approve and invite lead"
      );
    }
  }

  return (
    <PageShell
      eyebrow="Admin"
      title="Enterprise Leads"
      description="Review private beta and enterprise inquiries from the public landing page."
    >
      {error ? (
        <div className="vs-banner vs-banner-danger">{error}</div>
      ) : null}

      {message ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534" }}
        >
          {message}
        </div>
      ) : null}

      <SectionCard
        title="Filters"
        subtitle="Search and triage incoming leads."
      >
        <div className="vs-grid-3">
          <select
            className="vs-select"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="won">Won</option>
            <option value="archived">Archived</option>
          </select>

          <input
            className="vs-input"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Search by name, firm, email, or role"
          />

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => setFilters({ status: "", q: "" })}
          >
            Clear Filters
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Lead Queue"
        subtitle="Incoming requests from the landing page."
        right={<Badge tone="accent">{visibleLeads.length} leads</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading enterprise leads..." />
          ) : !visibleLeads.length ? (
            <EmptyState text="No enterprise leads found." />
          ) : (
            visibleLeads.map((lead) => (
              <div key={lead.id} className="vs-card" style={{ padding: "16px", display: "grid", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--vs-text)" }}>
                      {lead.full_name}
                    </div>
                    <div style={{ marginTop: "4px", color: "var(--vs-text-muted)", fontSize: "13px" }}>
                      {lead.firm_name} • {lead.email}
                    </div>
                  </div>

                  <div className="vs-chip-row">
                    <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
                    <Badge tone="default">{lead.role}</Badge>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    alignItems: "center"
                  }}
                >
                  <Badge tone={lifecycleTone(lead.is_beta_approved)}>
                    {lead.is_beta_approved ? "Approved" : "Not Approved"}
                  </Badge>

                  <Badge tone={lifecycleTone(lead.has_pending_invite)}>
                    {lead.has_pending_invite ? "Invited" : "No Invite"}
                  </Badge>

                  <Badge tone={lifecycleTone(lead.has_converted_user)}>
                    {lead.has_converted_user ? "Converted" : "Not Converted"}
                  </Badge>
                </div>

                <div className="vs-grid-2">
                  <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                    <div className="vs-stat-label">Source</div>
                    <div style={{ marginTop: "4px", fontWeight: 700 }}>
                      {lead.source || "landing_page"}
                    </div>
                  </div>

                  <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                    <div className="vs-stat-label">Submitted</div>
                    <div style={{ marginTop: "4px", fontWeight: 700 }}>
                      {formatDateTime(lead.created_at)}
                    </div>
                  </div>
                </div>

                <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                  <div className="vs-stat-label">Notes</div>
                  <div style={{ marginTop: "6px", color: "var(--vs-text)" }}>
                    {lead.notes || "No notes provided."}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="vs-button"
                    onClick={() => handleUpdateLead(lead.id, "contacted")}
                  >
                    Mark Contacted
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleUpdateLead(lead.id, "qualified")}
                  >
                    Mark Qualified
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleApproveLead(lead.id)}
                    disabled={Boolean(lead.is_beta_approved)}
                  >
                    {lead.is_beta_approved ? "Approved" : "Approve Email"}
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleInviteLead(lead.id)}
                    disabled={Boolean(lead.has_pending_invite) || Boolean(lead.has_converted_user)}
                  >
                    {lead.has_converted_user
                      ? "Already Converted"
                      : lead.has_pending_invite
                        ? "Invite Pending"
                        : "Send Invite"}
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleApproveAndInviteLead(lead.id)}
                    disabled={Boolean(lead.has_converted_user)}
                  >
                    {lead.has_converted_user ? "Converted" : "Approve + Invite"}
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleUpdateLead(lead.id, "won")}
                  >
                    Mark Won
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleUpdateLead(lead.id, "archived")}
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
