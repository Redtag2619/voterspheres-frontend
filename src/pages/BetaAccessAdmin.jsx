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
  if (value === "approved") return "active";
  if (value === "denied") return "danger";
  if (value === "pending") return "warning";
  return "default";
}

export default function BetaAccessAdmin() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    q: ""
  });
  const [approvalForm, setApprovalForm] = useState({
    access_type: "email",
    email: "",
    domain: "",
    notes: ""
  });

  const filteredRequests = useMemo(() => requests || [], [requests]);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [requestsRes, approvalsRes] = await Promise.all([
        api.get("/beta-admin/requests", {
          params: {
            status: filters.status || "",
            q: filters.q || ""
          }
        }),
        api.get("/beta-admin/approvals")
      ]);

      setRequests(requestsRes?.data?.results || []);
      setApprovals(approvalsRes?.data?.results || []);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load beta access dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [filters.status, filters.q]);

  async function handleUpdateRequest(id, status, autoApprove = false) {
    try {
      setMessage("");
      await api.patch(`/beta-admin/requests/${id}`, {
        status,
        auto_approve: autoApprove,
        review_notes:
          status === "approved"
            ? "Approved from admin beta dashboard"
            : "Denied from admin beta dashboard"
      });

      setMessage(
        status === "approved"
          ? "Request approved."
          : "Request denied."
      );

      await loadAll();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to update request"
      );
    }
  }

  async function handleCreateApproval(event) {
    event.preventDefault();

    try {
      setMessage("");
      setError("");

      await api.post("/beta-admin/approvals", approvalForm);

      setApprovalForm({
        access_type: "email",
        email: "",
        domain: "",
        notes: ""
      });

      setMessage("Approval saved.");
      await loadAll();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save approval"
      );
    }
  }

  async function handleDisableApproval(id) {
    try {
      setMessage("");
      await api.delete(`/beta-admin/approvals/${id}`);
      setMessage("Approval disabled.");
      await loadAll();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to disable approval"
      );
    }
  }

  return (
    <PageShell
      eyebrow="Admin"
      title="Beta Access Dashboard"
      description="Review access requests, approve operators, and control private beta entry."
    >
      {error ? (
        <div className="vs-banner vs-banner-danger">{error}</div>
      ) : null}

      {message ? (
        <div className="vs-banner" style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534" }}>
          {message}
        </div>
      ) : null}

      <SectionCard
        title="Filters"
        subtitle="Review the current beta pipeline."
      >
        <div className="vs-grid-3">
          <select
            className="vs-select"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
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

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "minmax(0, 1.2fr) minmax(360px, 0.8fr)" }}>
        <SectionCard
          title="Access Requests"
          subtitle="Public landing page and signup-originated beta requests."
          right={<Badge tone="warning">{filteredRequests.filter((r) => r.status === "pending").length} pending</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading beta requests..." />
            ) : !filteredRequests.length ? (
              <EmptyState text="No beta requests found." />
            ) : (
              filteredRequests.map((item) => (
                <div key={item.id} className="vs-card" style={{ padding: "16px", display: "grid", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--vs-text)" }}>
                        {item.full_name || "Unknown requester"}
                      </div>
                      <div style={{ marginTop: "4px", color: "var(--vs-text-muted)", fontSize: "13px" }}>
                        {item.firm_name || "No firm"} • {item.email}
                      </div>
                    </div>

                    <div className="vs-chip-row">
                      <Badge tone={statusTone(item.status)}>{item.status || "pending"}</Badge>
                      <Badge tone="default">{item.role || "role unknown"}</Badge>
                    </div>
                  </div>

                  <div className="vs-grid-2">
                    <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                      <div className="vs-stat-label">Source</div>
                      <div style={{ marginTop: "4px", fontWeight: 700 }}>{item.source || "landing_page"}</div>
                    </div>

                    <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                      <div className="vs-stat-label">Requested</div>
                      <div style={{ marginTop: "4px", fontWeight: 700 }}>{formatDateTime(item.created_at)}</div>
                    </div>
                  </div>

                  <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                    <div className="vs-stat-label">Notes</div>
                    <div style={{ marginTop: "6px", color: "var(--vs-text)" }}>
                      {item.notes || "No notes provided."}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="vs-button"
                      onClick={() => handleUpdateRequest(item.id, "approved", true)}
                    >
                      Approve + Allow Email
                    </button>

                    <button
                      type="button"
                      className="vs-button vs-button-secondary"
                      onClick={() => handleUpdateRequest(item.id, "denied", false)}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="Manual Approval"
            subtitle="Approve an exact email or an entire domain."
          >
            <form onSubmit={handleCreateApproval} className="vs-stack">
              <select
                className="vs-select"
                value={approvalForm.access_type}
                onChange={(e) =>
                  setApprovalForm((prev) => ({ ...prev, access_type: e.target.value }))
                }
              >
                <option value="email">Email approval</option>
                <option value="domain">Domain approval</option>
              </select>

              {approvalForm.access_type === "email" ? (
                <input
                  className="vs-input"
                  value={approvalForm.email}
                  onChange={(e) =>
                    setApprovalForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="operator@firm.com"
                />
              ) : (
                <input
                  className="vs-input"
                  value={approvalForm.domain}
                  onChange={(e) =>
                    setApprovalForm((prev) => ({ ...prev, domain: e.target.value }))
                  }
                  placeholder="firm.com"
                />
              )}

              <textarea
                className="vs-input"
                rows={4}
                value={approvalForm.notes}
                onChange={(e) =>
                  setApprovalForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Why this access was approved..."
                style={{ resize: "vertical" }}
              />

              <button type="submit" className="vs-button">
                Save Approval
              </button>
            </form>
          </SectionCard>

          <SectionCard
            title="Approved Access"
            subtitle="Current approved emails and domains."
            right={<Badge tone="active">{approvals.filter((item) => item.is_active).length} active</Badge>}
          >
            <div className="vs-stack">
              {loading ? (
                <EmptyState text="Loading approvals..." />
              ) : !approvals.length ? (
                <EmptyState text="No approvals saved yet." />
              ) : (
                approvals.map((item) => (
                  <div key={item.id} className="vs-card" style={{ padding: "16px", display: "grid", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "var(--vs-text)" }}>
                          {item.access_type === "domain" ? item.domain : item.email}
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--vs-text-muted)" }}>
                          {item.access_type} • saved {formatDateTime(item.created_at)}
                        </div>
                      </div>

                      <div className="vs-chip-row">
                        <Badge tone={item.is_active ? "active" : "default"}>
                          {item.is_active ? "active" : "inactive"}
                        </Badge>
                      </div>
                    </div>

                    {item.notes ? (
                      <div style={{ fontSize: "13px", color: "var(--vs-text-muted)" }}>
                        {item.notes}
                      </div>
                    ) : null}

                    {item.is_active ? (
                      <div>
                        <button
                          type="button"
                          className="vs-button vs-button-secondary"
                          onClick={() => handleDisableApproval(item.id)}
                        >
                          Disable
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
