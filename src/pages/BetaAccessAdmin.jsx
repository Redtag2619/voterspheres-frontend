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

export default function BetaAccessAdmin() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [pendingSignups, setPendingSignups] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    access_type: "email",
    email: "",
    domain: "",
    notes: ""
  });

  const summary = useMemo(() => {
    const items = approvals || [];
    const pending = pendingSignups || [];

    return {
      total: items.length,
      active: items.filter((item) => item.is_active).length,
      domain: items.filter((item) => item.access_type === "domain").length,
      pending: pending.filter((item) => item.status === "pending").length,
      invited: pending.filter((item) => item.status === "invited").length
    };
  }, [approvals, pendingSignups]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [approvalsRes, pendingRes] = await Promise.all([
        api.get("/beta-admin", {
          params: { q: query || "" }
        }),
        api.get("/beta-admin/pending-signups", {
          params: { q: query || "" }
        })
      ]);

      setApprovals(approvalsRes?.data?.results || []);
      setPendingSignups(pendingRes?.data?.results || []);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load beta access data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [query]);

  async function handleCreateApproval(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const body =
        form.access_type === "email"
          ? {
              access_type: "email",
              email: form.email,
              notes: form.notes
            }
          : {
              access_type: "domain",
              domain: form.domain,
              notes: form.notes
            };

      await api.post("/beta-admin", body);

      setMessage(
        form.access_type === "email"
          ? "Email approved for beta access."
          : "Domain approved for beta access."
      );

      setForm({
        access_type: form.access_type,
        email: "",
        domain: "",
        notes: ""
      });

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create beta approval"
      );
    }
  }

  async function handleToggleApproval(item) {
    try {
      setError("");
      setMessage("");

      await api.patch(`/beta-admin/${item.id}`, {
        is_active: !item.is_active,
        notes: item.notes || ""
      });

      setMessage(item.is_active ? "Approval revoked." : "Approval reactivated.");
      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to update approval"
      );
    }
  }

  async function handleApprovePending(item) {
    try {
      setError("");
      setMessage("");

      await api.post(`/beta-admin/pending-signups/${item.id}/approve`);

      setMessage(`Approved ${item.email}. They can now sign up.`);
      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to approve pending signup"
      );
    }
  }

  async function handleApproveAndInvitePending(item) {
    try {
      setError("");
      setMessage("");

      const response = await api.post(
        `/beta-admin/pending-signups/${item.id}/approve-and-invite`
      );

      if (response?.data?.email_sent) {
        setMessage(`Approved and invited ${item.email}. Invite email sent.`);
      } else if (response?.data?.invite_link) {
        setMessage(
          `Approved and invited ${item.email}. Email was not sent, so share this link manually: ${response.data.invite_link}`
        );
      } else {
        setMessage(`Approved and invited ${item.email}.`);
      }

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to approve and invite pending signup"
      );
    }
  }

  async function handleRejectPending(item) {
    try {
      setError("");
      setMessage("");

      await api.patch(`/beta-admin/pending-signups/${item.id}/reject`);

      setMessage(`Rejected ${item.email}.`);
      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to reject pending signup"
      );
    }
  }

  return (
    <PageShell
      eyebrow="Admin"
      title="Beta Access"
      description="Approve emails or domains for private beta signup access, and convert blocked signup attempts into live onboarding."
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

      <div className="vs-grid-4" style={{ marginBottom: "16px" }}>
        <div className="vs-card" style={{ padding: "16px" }}>
          <div className="vs-stat-label">Total Rules</div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 900 }}>
            {summary.total}
          </div>
        </div>

        <div className="vs-card" style={{ padding: "16px" }}>
          <div className="vs-stat-label">Active</div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 900 }}>
            {summary.active}
          </div>
        </div>

        <div className="vs-card" style={{ padding: "16px" }}>
          <div className="vs-stat-label">Pending Signups</div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 900 }}>
            {summary.pending}
          </div>
        </div>

        <div className="vs-card" style={{ padding: "16px" }}>
          <div className="vs-stat-label">Invited</div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 900 }}>
            {summary.invited}
          </div>
        </div>
      </div>

      <SectionCard
        title="Create Approval"
        subtitle="Allow one email or an entire company domain into the private beta."
      >
        <form onSubmit={handleCreateApproval} className="vs-stack">
          <div className="vs-grid-3">
            <select
              className="vs-select"
              value={form.access_type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, access_type: e.target.value }))
              }
            >
              <option value="email">Email</option>
              <option value="domain">Domain</option>
            </select>

            {form.access_type === "email" ? (
              <input
                className="vs-input"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="user@example.com"
                required
              />
            ) : (
              <input
                className="vs-input"
                type="text"
                value={form.domain}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, domain: e.target.value }))
                }
                placeholder="campaignfirm.com"
                required
              />
            )}

            <input
              className="vs-input"
              type="text"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Notes"
            />
          </div>

          <div>
            <button type="submit" className="vs-button">
              Add Approval
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Pending Signup Attempts"
        subtitle="Approve blocked signups or convert them directly into invite-based onboarding."
        right={
          <input
            className="vs-input"
            style={{ minWidth: "260px" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, name, or firm"
          />
        }
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading pending signups..." />
          ) : !pendingSignups.length ? (
            <EmptyState text="No pending signup attempts found." />
          ) : (
            pendingSignups.map((item) => (
              <div
                key={item.id}
                className="vs-card"
                style={{ padding: "16px", display: "grid", gap: "12px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 800 }}>
                      {[item.first_name, item.last_name].filter(Boolean).join(" ") || item.email}
                    </div>
                    <div style={{ marginTop: "4px", color: "var(--vs-text-muted)", fontSize: "13px" }}>
                      {item.email} • {item.firm_name || "No firm"} • {item.requested_role || "user"}
                    </div>
                  </div>

                  <div className="vs-chip-row">
                    <Badge tone={
                      item.status === "pending"
                        ? "warning"
                        : item.status === "approved" || item.status === "invited"
                          ? "active"
                          : "default"
                    }>
                      {item.status}
                    </Badge>
                    {item.already_approved ? <Badge tone="active">Already Approved</Badge> : null}
                  </div>
                </div>

                <div className="vs-grid-2">
                  <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                    <div className="vs-stat-label">Submitted</div>
                    <div style={{ marginTop: "4px", fontWeight: 700 }}>
                      {formatDateTime(item.created_at)}
                    </div>
                  </div>

                  <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                    <div className="vs-stat-label">Reviewed By</div>
                    <div style={{ marginTop: "4px", fontWeight: 700 }}>
                      {item.reviewed_by_email || "Not reviewed"}
                    </div>
                  </div>
                </div>

                <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                  <div className="vs-stat-label">Notes</div>
                  <div style={{ marginTop: "6px", color: "var(--vs-text)" }}>
                    {item.notes || "No notes."}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="vs-button"
                    onClick={() => handleApprovePending(item)}
                    disabled={item.status === "approved" || item.status === "invited"}
                  >
                    {item.status === "approved" || item.status === "invited"
                      ? "Approved"
                      : "Approve Only"}
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleApproveAndInvitePending(item)}
                    disabled={item.status === "invited"}
                  >
                    {item.status === "invited" ? "Invited" : "Approve & Invite"}
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleRejectPending(item)}
                    disabled={item.status === "rejected"}
                  >
                    {item.status === "rejected" ? "Rejected" : "Reject"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Approval Directory"
        subtitle="Manage current beta-access rules."
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading beta approvals..." />
          ) : !approvals.length ? (
            <EmptyState text="No beta approvals found." />
          ) : (
            approvals.map((item) => (
              <div
                key={item.id}
                className="vs-card"
                style={{ padding: "16px", display: "grid", gap: "12px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 800 }}>
                      {item.access_type === "email" ? item.email : item.domain}
                    </div>
                    <div style={{ marginTop: "4px", color: "var(--vs-text-muted)", fontSize: "13px" }}>
                      {item.access_type === "email" ? "Email approval" : "Domain approval"}
                    </div>
                  </div>

                  <div className="vs-chip-row">
                    <Badge tone={item.is_active ? "active" : "default"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge tone="default">{item.access_type}</Badge>
                  </div>
                </div>

                <div className="vs-grid-2">
                  <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                    <div className="vs-stat-label">Approved By</div>
                    <div style={{ marginTop: "4px", fontWeight: 700 }}>
                      {item.approved_by_email || "N/A"}
                    </div>
                  </div>

                  <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                    <div className="vs-stat-label">Updated</div>
                    <div style={{ marginTop: "4px", fontWeight: 700 }}>
                      {formatDateTime(item.updated_at)}
                    </div>
                  </div>
                </div>

                <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                  <div className="vs-stat-label">Notes</div>
                  <div style={{ marginTop: "6px", color: "var(--vs-text)" }}>
                    {item.notes || "No notes."}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => handleToggleApproval(item)}
                  >
                    {item.is_active ? "Revoke Access" : "Reactivate"}
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
