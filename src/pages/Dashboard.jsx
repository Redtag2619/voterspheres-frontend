import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { intelligenceApi, crmApi } from "../services/api";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function StatCard({ label, value, delta, tone = "up" }) {
  const toneClass =
    tone === "alert"
      ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
      : "border-cyan-400/20 bg-cyan-500/10 text-cyan-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 shadow-xl">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${toneClass}`}>
        {delta}
      </div>
    </div>
  );
}

function Section({ title, subtitle, right, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
      <div className="mb-5 flex justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [crmDashboard, setCrmDashboard] = useState({});
  const [forecast, setForecast] = useState({ battlegrounds: [] });
  const [fundraising, setFundraising] = useState({ leaderboard: [] });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [crm, forecastData, fundraisingData] = await Promise.all([
          crmApi.campaigns(), // fallback if summary not ready
          intelligenceApi.forecast(),
          intelligenceApi.fundraisingLeaderboard()
        ]);

        if (!active) return;

        setCrmDashboard(crm || {});
        setForecast(forecastData || {});
        setFundraising(fundraisingData || {});
      } catch (err) {
        if (!active) return;
        setError(err.message || "Dashboard failed");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => (active = false);
  }, []);

  const battlegrounds = useMemo(
    () => (forecast.battlegrounds || []).slice(0, 6),
    [forecast]
  );

  const leaders = useMemo(
    () => (fundraising.leaderboard || []).slice(0, 6),
    [fundraising]
  );

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">

        {error && (
          <div className="text-red-400">{error}</div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Campaigns" value={crmDashboard.length || 0} delta="Live CRM" />
          <StatCard label="Battlegrounds" value={battlegrounds.length} delta="Forecast" />
          <StatCard label="Leaders" value={leaders.length} delta="Fundraising" />
          <StatCard label="Status" value="Connected" delta="API OK" />
        </div>

        <Section title="Battlegrounds">
          {loading ? "Loading..." : battlegrounds.map((b, i) => (
            <div key={i}>{b.state || b.name}</div>
          ))}
        </Section>

        <Section title="Fundraising Leaders">
          {leaders.map((l, i) => (
            <div key={i}>
              {l.name} — {formatMoney(l.receipts)}
            </div>
          ))}
        </Section>

      </div>
    </div>
  );
}
