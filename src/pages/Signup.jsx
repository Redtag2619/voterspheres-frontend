import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    firm_name: "",
    email: "",
    password: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      await signup({
        ...form,
        role: "admin"
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
            VoterSpheres
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Start your firm’s political operating system.
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="First name"
                value={form.first_name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, first_name: e.target.value }))
                }
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                placeholder="Last name"
                value={form.last_name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, last_name: e.target.value }))
                }
              />
            </div>

            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder="Firm name"
              value={form.firm_name}
              onChange={(e) =>
                setForm((s) => ({ ...s, firm_name: e.target.value }))
              }
            />

            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              type="email"
              placeholder="you@firm.com"
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
            />

            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              type="password"
              placeholder="Password (8+ characters)"
              value={form.password}
              onChange={(e) =>
                setForm((s) => ({ ...s, password: e.target.value }))
              }
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#0176D3]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
