import { useEffect, useState } from "react";
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
    year: "numeric"
  }).format(date);
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "accepted") return "active";
  if (value === "revoked") return "danger";
  if (value === "pending") return "warning";
  return "default";
}

export default function FirmInvitesAdmin() {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "user",
    notes: ""
  });

  async function loadInvites() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/firm-invites");
      setInvites(response?.data?.results || []);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load firm invites"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvites();
  }, []);

  async function handleCreateInvite(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await api.post("/firm-invites", form);

      const inviteLink = response?.data?.invite_link;
      const emailSent = response?.data?.email_sent;

      setForm({
        first_name: "",
        last_name: "",
        email: "",
        role: "user",
        notes: ""
      });

      setMessage(
        emailSent
          ? "Invite sent successfully."
          : `Invite created. Email not sent because SMTP is not configured. Share this link manually: ${inviteLink}`
      );

      await loadInvites();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create invite"
      );
    }
  }

  async function handleResendInvite(id) {
    try {
      setError("");
      setMessage("");

      const response = await api.post(`/firm-invites/${id}/resend`);
      const inviteLink = response?.data?.invite_link;
      const emailSent = response?.data?.email_sent;

      setMessage(
        emailSent
          ? "Invite resent successfully."
          : `Invite refreshed. Email not sent because SMTP is not configured. Share this link manually: ${inviteLink}`
      );

      await loadInvites();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to resend invite"
      );
    }
  }

  async function handleRevokeInvite(id) {
    try {
      setError("");
      setMessage("");

      await api.patch(`/firm-invites/${id}/revoke`);
      setMessage("Invite revoked.");
      await loadInvites();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to revoke invite"
      );
    }
  }

  return (
    <PageShell
      eyebrow="Admin"
      title="Firm Invitations"
      description="Invite users by email and let them set their password on first access."
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" }}
        >
          {message}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.9fr)" }}>
        <SectionCard
          title="Firm Invites"
          subtitle="Pending, accepted, and revoked invitations."
          right={<Badge tone="warning">{invites.filter((i) => i.status === "pending").length} pending</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading firm invites..." />
            ) : !invites.length ? (
              <EmptyState text="No invites found yet." />
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="vs-card" style={{ padding: "16px", display: "grid", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--vs-text)" }}>
                        {invite.first_name} {invite.last_name}
                      </div>
                      <div style={{ marginTop: "4px", color: "var(--vs-text-muted)", fontSize: "13px" }}>
                        {invite.email}
                      </div>
                    </div>

                    <div className="vs-chip-row">
                      <Badge tone={statusTone(invite.status)}>{invite.status}</Badge>
                      <Badge tone="default">{invite.role}</Badge>
                    </div>
                  </div>

                  <div className="vs-grid-2">
                    <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                      <div className="vs-stat-label">Created</div>
                      <div style={{ marginTop: "4px", fontWeight: 700 }}>
                        {formatDateTime(invite.created_at)}
                      </div>
                    </div>

                    <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                      <div className="vs-stat-label">Expires</div>
                      <div style={{ marginTop: "4px", fontWeight: 700 }}>
                        {formatDateTime(invite.expires_at)}
                      </div>
                    </div>
                  </div>

                  {invite.notes ? (
                    <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                      <div className="vs-stat-label">Notes</div>
                      <div style={{ marginTop: "6px" }}>{invite.notes}</div>
                    </div>
                  ) : null}

                  {invite.status === "pending" ? (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="vs-button"
                        onClick={() => handleResendInvite(invite.id)}
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        className="vs-button vs-button-secondary"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        Revoke
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Invite User"
          subtitle="Send a role-based invite into your firm workspace."
        >
          <form onSubmit={handleCreateInvite} className="vs-stack">
            <div className="vs-grid-2">
              <input
                className="vs-input"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                placeholder="First name"
                required
              />
              <input
                className="vs-input"
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                placeholder="Last name"
                required
              />
            </div>

            <input
              className="vs-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Work email"
              required
            />

            <select
              className="vs-select"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="user">User</option>
              <option value="analyst">Analyst</option>
              <option value="strategist">Strategist</option>
              <option value="mailops">MailOps</option>
              <option value="admin">Admin</option>
            </select>

            <textarea
              className="vs-input"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes"
              style={{ resize: "vertical" }}
            />

            <button type="submit" className="vs-button">
              Send Invite
            </button>
          </form>
        </SectionCard>
      </div>
    </PageShell>
  );
}
