import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  clearTrialIntent,
  getTrialIntent,
  saveTrialIntent,
} from "../lib/trialIntent";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    firm_name: "",
    email: "",
    password: "",
    role: "admin",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const incomingIntent = useMemo(() => {
    const stateIntent = location.state || {};
    const storedIntent = getTrialIntent();

    return {
      selectedPlan:
        stateIntent.selectedPlan || storedIntent?.selectedPlan || "",
      trialDays:
        Number(stateIntent.trialDays || storedIntent?.trialDays || 7) || 7,
      source: stateIntent.source || storedIntent?.source || "pricing",
    };
  }, [location.state]);

  useEffect(() => {
    if (incomingIntent.selectedPlan) {
      saveTrialIntent(incomingIntent);
    }
  }, [incomingIntent]);

  useEffect(() => {
    if (isAuthenticated) {
      const intent = getTrialIntent();

      if (intent?.selectedPlan) {
        navigate("/pricing", {
          replace: true,
          state: {
            selectedPlan: intent.selectedPlan,
            trialDays: intent.trialDays,
            fromSignup: true,
          },
        });
        return;
      }

      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signup(form);

      const intent = getTrialIntent();

      if (intent?.selectedPlan) {
        navigate("/pricing", {
          replace: true,
          state: {
            selectedPlan: intent.selectedPlan,
            trialDays: intent.trialDays,
            fromSignup: true,
          },
        });
        return;
      }

      clearTrialIntent();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.error ||
          "Unable to create your account right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>VoterSpheres</div>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>
          Get into the platform fast and continue your selected trial flow.
        </p>

        {incomingIntent.selectedPlan ? (
          <div style={styles.intentBox}>
            <div style={styles.intentBadge}>Selected Trial</div>
            <div style={styles.intentText}>
              You are signing up for a{" "}
              <strong>{String(incomingIntent.selectedPlan).toUpperCase()}</strong>{" "}
              plan path with a <strong>{incomingIntent.trialDays}-day trial</strong>.
            </div>
          </div>
        ) : null}

        {error ? <div style={styles.error}>{error}</div> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>First Name</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={updateField}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Last Name</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={updateField}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Firm Name</label>
            <input
              name="firm_name"
              value={form.firm_name}
              onChange={updateField}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={updateField}
              style={styles.input}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>

          <button type="submit" disabled={submitting} style={styles.primaryButton}>
            {submitting
              ? "Creating account..."
              : incomingIntent.selectedPlan
              ? `Continue to ${String(incomingIntent.selectedPlan).toUpperCase()} Trial`
              : "Create Account"}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account?{" "}
          <Link
            to="/login"
            state={
              incomingIntent.selectedPlan
                ? {
                    selectedPlan: incomingIntent.selectedPlan,
                    trialDays: incomingIntent.trialDays,
                    source: incomingIntent.source,
                  }
                : undefined
            }
            style={styles.link}
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at top, rgba(37,99,235,0.14) 0%, rgba(11,16,32,1) 35%, rgba(15,23,42,1) 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "620px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "22px",
    padding: "28px",
    color: "#fff",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  },
  brand: {
    fontWeight: 800,
    color: "#60a5fa",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 900,
  },
  subtitle: {
    marginTop: "10px",
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  intentBox: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "14px",
    background: "#111827",
    border: "1px solid #2563eb",
  },
  intentBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#2563eb",
    fontSize: "0.76rem",
    fontWeight: 700,
    marginBottom: "10px",
  },
  intentText: {
    color: "#dbeafe",
    lineHeight: 1.6,
  },
  error: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#34181b",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
  },
  form: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.92rem",
    color: "#cbd5e1",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
  primaryButton: {
    marginTop: "6px",
    padding: "13px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  footer: {
    marginTop: "18px",
    color: "#94a3b8",
  },
  link: {
    color: "#60a5fa",
    textDecoration: "none",
    fontWeight: 700,
  },
};
