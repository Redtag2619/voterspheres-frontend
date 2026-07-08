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

const ROLE_OPTIONS = ["user", "analyst", "strategist", "mailops", "admin"];

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "accepted") return "active";
  if (value === "revoked") return "danger";
  if (value === "pending") return "warning";
  return "default";
}

function roleTone(role) {
  const value = String(role || "").toLowerCase();
  if (value === "admin") return "danger";
  if (value === "strategist") return "accent";
  if (value === "analyst") return "info";
  if (value === "mailops") return "warning";
  return "default";
}

function buildSummary(invites = []) {
  return {
    total: invites.length,
    pending: invites.filter((invite) => invite.status === "pending").length,
    accepted: invites.filter((invite) => invite.status === "accepted").length,
    revoked: invites.filter((invite) => invite.status === "revoked").length,
    admins: invites.filter((invite) => String(invite.role || "").toLowerCase() === "admin").length,
    strategists: invites.filter((invite) => String(invite.role || "").toLowerCase() === "strategist").length,
    analysts: invites.filter((invite) => String(invite.role || "").toLowerCase() === "analyst").length,
    mailops: invites.filter((invite) => String(invite.role || "").toLowerCase() === "mailops").length,
  };
}

function FirmInvitesExecutiveHeader({ summary, loading, lastUpdated, onRefresh }) {
  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        76 +
          Math.min(10, summary.accepted * 3) +
          Math.min(8, summary.admins * 3) +
          Math.min(8, summary.strategists * 2) -
          Math.min(18, summary.pending * 2) -
          Math.min(14, summary.revoked * 3) -
          (loading ? 6 : 0)
      )
    )
  );

  return (
    <div className="invites-exec-ribbon" id="invites-overview">
      <div className="invites-exec-copy">
        <span>Invite Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive invitation center for role-based user onboarding, pending invites,
          accepted access, revoked links, SMTP/manual invite handoff, and firm workspace
          access growth.
        </p>

        <div className="invites-exec-badges">
          <Badge tone="warning">{summary.pending} Pending</Badge>
          <Badge tone="active">{summary.accepted} Accepted</Badge>
          <Badge tone={summary.revoked ? "danger" : "active"}>{summary.revoked} Revoked</Badge>
          <Badge tone="accent">{summary.total} Total Invites</Badge>
          <Badge tone="danger">{summary.admins} Admin Invites</Badge>
        </div>
      </div>

      <div className="invites-exec-grid">
        <div>
          <span>Total Invites</span>
          <strong>{fmt(summary.total)}</strong>
        </div>
        <div>
          <span>Pending Queue</span>
          <strong>{fmt(summary.pending)}</strong>
        </div>
        <div>
          <span>Invite Status</span>
          <strong>{loading ? "Refreshing" : "Ready"}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{lastUpdated || "Ready"}</strong>
        </div>
      </div>

      <div className="invites-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Invites"}
        </button>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("invites-create")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          Invite User
        </button>
        <Link to="/firm-users">Firm Users</Link>
        <Link to="/client-portal-admin">Client Portal</Link>
        <Link to="/enterprise-leads">Enterprise Leads</Link>
        <Link to="/mission-control">Mission Control</Link>
      </div>

      <div className="invites-exec-footer">
        <span>Invite lifecycle: pending, accepted, revoked</span>
        <span>First access: invite token password setup</span>
      </div>
    </div>
  );
}

function InviteBrief({ summary, invites }) {
  const pendingAdmins = invites.filter(
    (invite) =>
      invite.status === "pending" &&
      String(invite.role || "").toLowerCase() === "admin"
  ).length;

  const nextExpiring = [...invites]
    .filter((invite) => invite.status === "pending" && invite.expires_at)
    .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at))[0];

  return (
    <div className="invites-ai-brief">
      <strong>Executive Invite Brief</strong>
      <p>
        The firm currently has {fmt(summary.total)} invitations, including{" "}
        {fmt(summary.pending)} pending, {fmt(summary.accepted)} accepted, and{" "}
        {fmt(summary.revoked)} revoked. {pendingAdmins
          ? `${fmt(pendingAdmins)} pending admin invite${pendingAdmins === 1 ? "" : "s"} should be monitored closely.`
          : "No pending admin invite risk is visible."}
        {nextExpiring
          ? ` Next pending invite expiration: ${formatDateTime(nextExpiring.expires_at)} for ${nextExpiring.email || "an invited user"}.`
          : " No pending invite expiration is currently visible."}
      </p>

      <div className="invites-ai-brief-grid">
        <div><span>Pending</span><b>{fmt(summary.pending)}</b></div>
        <div><span>Accepted</span><b>{fmt(summary.accepted)}</b></div>
        <div><span>Revoked</span><b>{fmt(summary.revoked)}</b></div>
        <div><span>Pending Admins</span><b>{fmt(pendingAdmins)}</b></div>
      </div>
    </div>
  );
}

function RoleInviteGrid({ invites }) {
  return (
    <div className="invites-role-grid">
      {ROLE_OPTIONS.map((role) => {
        const count = invites.filter(
          (invite) => String(invite.role || "").toLowerCase() === role
        ).length;

        return (
          <div key={role} className="invites-role-card">
            <span>{role}</span>
            <strong>{fmt(count)}</strong>
            <Badge tone={roleTone(role)}>{role}</Badge>
          </div>
        );
      })}
    </div>
  );
}

function InviteRow({ invite, onResendInvite, onRevokeInvite }) {
  const fullName =
    `${invite.first_name || ""} ${invite.last_name || ""}`.trim() ||
    invite.email ||
    "Firm Invite";

  return (
    <div className="invite-row">
      <ResponsiveRow
        title={fullName}
        subtitle={invite.email || "No email"}
        meta={[
          { label: "Status", value: invite.status || "pending" },
          { label: "Role", value: invite.role || "user" },
          { label: "Created", value: formatDateTime(invite.created_at) },
          { label: "Expires", value: formatDateTime(invite.expires_at) },
        ]}
        right={
          <div className="invite-badges">
            <Badge tone={statusTone(invite.status)}>{invite.status || "pending"}</Badge>
            <Badge tone={roleTone(invite.role)}>{invite.role || "user"}</Badge>
          </div>
        }
      />

      {invite.notes ? (
        <div className="invite-notes">
          <span>Notes</span>
          <p>{invite.notes}</p>
        </div>
      ) : null}

      {invite.status === "pending" ? (
        <div className="invite-actions">
          <button
            type="button"
            className="vs-button"
            onClick={() => onResendInvite(invite.id)}
          >
            Resend
          </button>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => onRevokeInvite(invite.id)}
          >
            Revoke
          </button>
        </div>
      ) : null}
    </div>
  );
}

function InviteActionCenter({ loading, onRefresh }) {
  return (
    <div className="invites-action-center">
      <button type="button" onClick={onRefresh} disabled={loading}>
        Refresh Invites
      </button>
      <button
        type="button"
        onClick={() =>
          document
            .getElementById("invites-create")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      >
        Invite Firm User
      </button>
      <Link to="/firm-users">Open Firm Users</Link>
      <Link to="/client-portal-admin">Client Portal Admin</Link>
      <Link to="/enterprise-leads">Enterprise Leads</Link>
      <Link to="/billing">Billing</Link>
      <Link to="/mission-control">Mission Control</Link>
      <Link to="/command-center">Command Center</Link>
    </div>
  );
}

export default function FirmInvitesAdmin() {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "user",
    notes: "",
  });

  async function loadInvites() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/firm-invites");
      setInvites(response?.data?.results || []);
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
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
        notes: "",
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

  const summary = useMemo(() => buildSummary(invites), [invites]);

  const navSections = [
    { id: "invites-overview", label: "Overview" },
    { id: "invites-metrics", label: "Metrics" },
    { id: "invites-list", label: "Invites", badge: invites.length },
    { id: "invites-create", label: "Invite User" },
    { id: "invites-intelligence", label: "Intelligence" },
    { id: "invites-actions", label: "Actions" },
  ];

  return (
    <PageShell
      eyebrow="Admin"
      title="Firm Invitations"
      description="Invite users by email and let them set their password on first access."
      tickerItems={[
        { label: "Pending", value: `${summary.pending}`, dotClass: summary.pending ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Accepted", value: `${summary.accepted}`, dotClass: "vs-live-dot-success" },
        { label: "Revoked", value: `${summary.revoked}`, dotClass: summary.revoked ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .invites-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(234, 179, 8, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .invites-exec-copy { min-width: 0; }

        .invites-exec-copy span,
        .invites-exec-grid span,
        .invites-exec-footer span,
        .invites-ai-brief-grid span,
        .invites-role-card span,
        .invite-notes span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .invites-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .invites-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .invites-exec-badges,
        .invites-exec-actions,
        .invites-exec-footer,
        .invites-action-center,
        .invite-badges,
        .invite-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .invites-exec-badges { margin-top: 14px; }

        .invites-exec-grid,
        .invites-ai-brief-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .invites-exec-grid div,
        .invites-ai-brief-grid div,
        .invites-role-card {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .invites-exec-grid strong,
        .invites-ai-brief-grid b,
        .invites-role-card strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .invites-exec-actions,
        .invites-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .invites-exec-actions button,
        .invites-exec-actions a,
        .invites-action-center button,
        .invites-action-center a {
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

        .invites-exec-actions button:hover,
        .invites-exec-actions a:hover,
        .invites-action-center button:hover,
        .invites-action-center a:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .invites-exec-actions button:disabled,
        .invites-action-center button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .invites-exec-stack,
        .invites-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .invites-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
          align-items: start;
        }

        .invite-row {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          overflow: hidden;
        }

        .invite-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .invite-notes {
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding: 12px 14px;
        }

        .invite-notes p {
          margin: 6px 0 0;
          color: rgba(226, 232, 240, 0.88);
          line-height: 1.55;
        }

        .invite-actions {
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding: 12px 14px 14px;
        }

        .invites-ai-brief {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .invites-ai-brief strong {
          display: block;
          color: white;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .invites-ai-brief p {
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 14px;
        }

        .invites-role-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .invites-role-card {
          display: grid;
          gap: 8px;
          align-content: start;
        }

        @media (max-width: 1100px) {
          .invites-grid,
          .invites-exec-ribbon,
          .invites-exec-grid,
          .invites-ai-brief-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="invites-exec-stack">
        <FirmInvitesExecutiveHeader
          summary={summary}
          loading={loading}
          lastUpdated={lastUpdated}
          onRefresh={loadInvites}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      {message ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" }}
        >
          {message}
        </div>
      ) : null}

      <CollapsibleSection
        id="invites-metrics"
        title="Invite Metrics"
        subtitle="Pending, accepted, revoked, and role-based invitation coverage."
        defaultOpen
        right={<Badge tone="warning">{summary.pending} Pending</Badge>}
      >
        <div className="vs-grid-4">
          <StatCard label="Total Invites" value={fmt(summary.total)} delta="Firm onboarding" tone="up" />
          <StatCard label="Pending" value={fmt(summary.pending)} delta="Awaiting acceptance" tone={summary.pending ? "neutral" : "up"} />
          <StatCard label="Accepted" value={fmt(summary.accepted)} delta="Converted to users" tone="up" />
          <StatCard label="Revoked" value={fmt(summary.revoked)} delta="Disabled links" tone={summary.revoked ? "neutral" : "up"} />
        </div>
      </CollapsibleSection>

      <div className="invites-grid">
        <CollapsibleSection
          id="invites-list"
          title="Firm Invites"
          subtitle="Pending, accepted, and revoked invitations."
          defaultOpen
          right={<Badge tone="warning">{summary.pending} pending</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading firm invites..." />
          ) : !invites.length ? (
            <EmptyState text="No invites found yet." />
          ) : (
            <ShowMoreList
              items={invites}
              initialCount={10}
              showAllLabel={(count) => `Show All ${count} Firm Invites`}
              className="invites-stack"
              renderItem={(invite) => (
                <InviteRow
                  invite={invite}
                  onResendInvite={handleResendInvite}
                  onRevokeInvite={handleRevokeInvite}
                />
              )}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection
          id="invites-create"
          title="Invite User"
          subtitle="Send a role-based invite into your firm workspace."
          defaultOpen
          right={<Badge tone="accent">Role Access</Badge>}
        >
          <form onSubmit={handleCreateInvite} className="vs-stack">
            <div className="vs-grid-2">
              <input
                className="vs-input"
                value={form.first_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, first_name: event.target.value }))
                }
                placeholder="First name"
                required
              />

              <input
                className="vs-input"
                value={form.last_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, last_name: event.target.value }))
                }
                placeholder="Last name"
                required
              />
            </div>

            <input
              className="vs-input"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Work email"
              required
            />

            <select
              className="vs-select"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value }))
              }
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
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Optional notes"
              style={{ resize: "vertical" }}
            />

            <button type="submit" className="vs-button">
              Send Invite
            </button>
          </form>
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="invites-intelligence"
        title="Invite Intelligence"
        subtitle="Role distribution and onboarding risk summary for firm invitations."
        defaultOpen={false}
        right={<Badge tone={summary.pending ? "warning" : "active"}>{summary.pending} Pending</Badge>}
      >
        <div className="invites-stack">
          <RoleInviteGrid invites={invites} />
          <InviteBrief summary={summary} invites={invites} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="invites-actions"
        title="Executive Action Center"
        subtitle="Move invitation and onboarding workflows into connected VoterSpheres modules."
        defaultOpen={false}
        right={<Badge tone="active">Invite Handoff</Badge>}
      >
        <InviteActionCenter loading={loading} onRefresh={loadInvites} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}

