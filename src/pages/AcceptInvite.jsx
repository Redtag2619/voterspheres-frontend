import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const canSubmit = useMemo(() => {
    return password.length >= 8 && password === passwordConfirm;
  }, [password, passwordConfirm]);

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setError("Invite token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/public/invite?token=${encodeURIComponent(token)}`);
        setInvite(response?.data?.invite || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load invite"
        );
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);
      setError("");

      await api.post("/public/invite/accept", {
        token,
        password
      });

      navigate("/login");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to accept invite"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="vs-loading-screen" style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div className="vs-card" style={{ width: "100%", maxWidth: "560px", padding: "24px" }}>
        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--vs-text-muted)", fontWeight: 800 }}>
          Invite Access
        </div>

        <h1 style={{ marginTop: "10px", marginBottom: "8px", fontSize: "32px", lineHeight: 1.05 }}>
          Set your VoterSpheres password
        </h1>

        {loading ? (
          <div style={{ color: "var(--vs-text-muted)" }}>Loading invite...</div>
        ) : error ? (
          <div className="vs-banner vs-banner-danger">{error}</div>
        ) : (
          <>
            <div className="vs-card-muted" style={{ padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontWeight: 800, color: "var(--vs-text)" }}>
                {invite?.first_name} {invite?.last_name}
              </div>
              <div style={{ marginTop: "4px", color: "var(--vs-text-muted)", fontSize: "13px" }}>
                {invite?.email} • {invite?.firm_name} • {invite?.role}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="vs-stack">
              <div className="vs-stack">
                <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                  Password
                </label>
                <input
                  className="vs-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="vs-stack">
                <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                  Confirm Password
                </label>
                <input
                  className="vs-input"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {!canSubmit && password ? (
                <div style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                  Password must be at least 8 characters and both entries must match.
                </div>
              ) : null}

              <button
                type="submit"
                className="vs-button vs-button-primary"
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Creating account..." : "Accept Invite"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
