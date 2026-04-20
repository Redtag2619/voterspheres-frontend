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
    return {
      total: items.length,
      active: items.filter((item) => item.is_active).length,
      inactive: items.filter((item) => !item.is_active).length,
      email: items.filter((item) => item.access_type === "email").length,
      domain: items.filter((item) => item.access_type === "domain").length
    };
  }, [approvals]);

  async function loadApprovals() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/beta-admin", {
        params: {
          q: query || ""
        }
      });

      setApprovals(response?.data?.results || []);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load beta approvals"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
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

      await loadApprovals();
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
      await loadApprovals();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to update approval"
      );
    }
  }

  return (
    <PageShell
      eyebrow="Admin"
      title="Beta Access"
      description="Approve emails or domains for private beta signup access."
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
          <div className="vs-stat-label">Email Rules</div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 900 }}>
            {summary.email}
          </div>
        </div>

        <div className="vs-card" style={{ padding: "16px" }}>
          <div className="vs-stat-label">Domain Rules</div>
          <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 900 }}>
            {summary.domain}
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
        title="Approval Directory"
        subtitle="Manage current beta-access rules."
        right={
          <input
            className="vs-input"
            style={{ minWidth: "260px" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, domain, or notes"
          />
        }
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
