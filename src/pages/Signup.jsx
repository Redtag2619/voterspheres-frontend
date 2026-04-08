import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    firm_name: "",
    email: "",
    password: "",
    role: "admin"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        firm_name: form.firm_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Signup failed. Please review your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(245,158,11,0.08), transparent 22%), linear-gradient(180deg, #0b0f14 0%, #0e131a 100%)",
        color: "#eef2f7",
        display: "grid",
        placeItems: "center",
        padding: "24px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: "20px"
        }}
      >
        <section
          style={{
            border: "1px solid #273142",
            background: "linear-gradient(180deg, #121821 0%, #10161d 100%)",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
            minHeight: "680px"
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid rgba(245,158,11,0.24)",
              background: "rgba(245,158,11,0.08)",
              borderRadius: "999px",
              padding: "8px 12px",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#fbbf24",
              fontWeight: 800
            }}
          >
            <span className="vs-live-dot-success" />
            Platform access
          </div>

          <h1
            style={{
              marginTop: "24px",
              fontSize: "42px",
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              maxWidth: "580px"
            }}
          >
            Launch your campaign intelligence workspace.
          </h1>

          <p
            style={{
              marginTop: "16px",
              maxWidth: "560px",
              fontSize: "15px",
              lineHeight: 1.75,
              color: "#95a2b3"
            }}
          >
            Create your firm account and unlock access to command center visibility, donor and
            vendor intelligence, forecasting, and AI war room operations.
          </p>

          <div className="vs-grid-2" style={{ marginTop: "24px" }}>
            {[
              {
                title: "Executive oversight",
                text: "Premium dashboarding for battlegrounds, finance, and logistics."
              },
              {
                title: "Live operations",
                text: "Vendor, mail, and war room signals in one operating system."
              },
              {
                title: "Client-ready demos",
                text: "Presentation-quality screens for firms and campaign leadership."
              },
              {
                title: "Scalable workspace",
                text: "Built to grow across campaigns, teams, and market coverage."
              }
            ].map((item) => (
              <div
                key={item.title}
                className="vs-card-muted"
                style={{ padding: "16px" }}
              >
                <div style={{ fontWeight: 800, fontSize: "15px" }}>{item.title}</div>
                <div style={{ marginTop: "8px", color: "#95a2b3", fontSize: "14px", lineHeight: 1.65 }}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          <div className="vs-terminal-strip" style={{ marginTop: "24px" }}>
            <div className="vs-terminal-ticker">
              <span className="vs-live-dot-success" />
              <strong>Setup</strong>
              <span>Firm account ready</span>
            </div>
            <div className="vs-terminal-ticker">
              <span className="vs-live-dot-warning" />
              <strong>Access</strong>
              <span>Command + billing enabled</span>
            </div>
          </div>
        </section>

        <section
          style={{
            border: "1px solid #273142",
            background: "linear-gradient(180deg, #121821 0%, #10161d 100%)",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
            display: "grid",
            alignContent: "center"
          }}
        >
          <div
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#f59e0b",
              fontWeight: 900
            }}
          >
            Create Account
          </div>

          <h2
            style={{
              marginTop: "12px",
              fontSize: "32px",
              lineHeight: 1.08,
              fontWeight: 850
            }}
          >
            Start your workspace.
          </h2>

          <p style={{ marginTop: "10px", color: "#95a2b3", fontSize: "14px", lineHeight: 1.7 }}>
            Enter your firm and user details to begin using VoterSpheres.
          </p>

          {error ? (
            <div className="vs-banner vs-banner-danger">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ marginTop: "22px", display: "grid", gap: "14px" }}>
            <div className="vs-grid-2">
              <div>
                <div className="vs-stat-label" style={{ marginBottom: "8px" }}>First Name</div>
                <input
                  className="vs-input"
                  value={form.first_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <div className="vs-stat-label" style={{ marginBottom: "8px" }}>Last Name</div>
                <input
                  className="vs-input"
                  value={form.last_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <div className="vs-stat-label" style={{ marginBottom: "8px" }}>Firm Name</div>
              <input
                className="vs-input"
                value={form.firm_name}
                onChange={(e) => setForm((prev) => ({ ...prev, firm_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <div className="vs-stat-label" style={{ marginBottom: "8px" }}>Email</div>
              <input
                className="vs-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <div className="vs-stat-label" style={{ marginBottom: "8px" }}>Password</div>
              <input
                className="vs-input"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <div>
              <div className="vs-stat-label" style={{ marginBottom: "8px" }}>Role</div>
              <select
                className="vs-select"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <button
              type="submit"
              className="vs-button vs-button-primary"
              style={{ marginTop: "6px", width: "100%" }}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div
            style={{
              marginTop: "18px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              fontSize: "14px",
              color: "#95a2b3"
            }}
          >
            <span>Already have an account?</span>
            <Link to="/login" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
              Sign in
            </Link>
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              fontSize: "14px",
              color: "#95a2b3"
            }}
          >
            <span>Need plan details?</span>
            <Link to="/pricing" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
              View pricing
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
