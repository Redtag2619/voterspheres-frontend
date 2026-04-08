import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password
      });

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Login failed. Please check your email and password."
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
          maxWidth: "1120px",
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
            display: "grid",
            alignContent: "space-between",
            minHeight: "640px"
          }}
        >
          <div>
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
              <span className="vs-live-dot-warning" />
              Live campaign intelligence
            </div>

            <div style={{ marginTop: "22px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  background: "#f59e0b",
                  color: "#0b0f14",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  boxShadow: "0 8px 20px rgba(245,158,11,0.28)"
                }}
              >
                VS
              </div>

              <div>
                <div
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.24em",
                    color: "#f59e0b",
                    fontWeight: 900
                  }}
                >
                  VoterSpheres
                </div>
                <div style={{ marginTop: "4px", fontSize: "14px", color: "#95a2b3" }}>
                  Campaign intelligence operating system
                </div>
              </div>
            </div>

            <h1
              style={{
                marginTop: "28px",
                fontSize: "44px",
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                maxWidth: "560px"
              }}
            >
              Enter the command layer for live campaign execution.
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
              Monitor battleground movement, vendor execution, donor pressure, forecast intelligence,
              and war room signal flow from a premium operating environment built for campaigns.
            </p>

            <div
              style={{
                marginTop: "26px",
                display: "grid",
                gap: "12px"
              }}
            >
              {[
                "Live command center visibility",
                "Forecast, donor, vendor, and war room intelligence",
                "Premium presentation mode for demos and clients"
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#d8e0ea",
                    fontSize: "14px"
                  }}
                >
                  <span className="vs-live-dot-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="vs-terminal-strip">
            <div className="vs-terminal-ticker">
              <span className="vs-live-dot" />
              <strong>Threats</strong>
              <span>4 high</span>
            </div>
            <div className="vs-terminal-ticker">
              <span className="vs-live-dot-warning" />
              <strong>Battlegrounds</strong>
              <span>7 tracked</span>
            </div>
            <div className="vs-terminal-ticker">
              <span className="vs-live-dot-success" />
              <strong>Fundraising</strong>
              <span>$12.8M pulse</span>
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
            Secure Login
          </div>

          <h2
            style={{
              marginTop: "12px",
              fontSize: "32px",
              lineHeight: 1.08,
              fontWeight: 850
            }}
          >
            Welcome back.
          </h2>

          <p style={{ marginTop: "10px", color: "#95a2b3", fontSize: "14px", lineHeight: 1.7 }}>
            Sign in to access your campaign workspace, command center, and billing controls.
          </p>

          {error ? (
            <div className="vs-banner vs-banner-danger">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ marginTop: "22px", display: "grid", gap: "14px" }}>
            <div>
              <div className="vs-stat-label" style={{ marginBottom: "8px" }}>Email</div>
              <input
                className="vs-input"
                type="email"
                placeholder="you@firm.com"
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
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              className="vs-button vs-button-primary"
              style={{ marginTop: "6px", width: "100%" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
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
            <span>Need an account?</span>
            <Link to="/signup" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
              Create one
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
            <span>Review plans first?</span>
            <Link to="/pricing" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
              View pricing
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
