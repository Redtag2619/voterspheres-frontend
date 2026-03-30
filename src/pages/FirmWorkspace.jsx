import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

function StatCard({ label, value, delta }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{delta}</div>
    </div>
  );
}

function Section({ title, subtitle, children, right }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

export default function FirmWorkspace() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError("");

  const response = await api.firmWorkspace(id);

      setData(response);
    } catch (err) {
      console.error("Firm workspace error:", err);
      setError(err.message || "Failed to load firm workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadWorkspace();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b14] p-6 text-white">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
          Loading firm workspace...
        </div>
      </div>
    );
  }

  if (error || !data?.firm) {
    return (
      <div className="min-h-screen bg-[#060b14] p-6 text-white">
        <div className="mx-auto max-w-7xl rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
          {error || "Firm workspace not found."}
        </div>
      </div>
    );
  }

  const {
    firm,
    metrics = [],
    team = [],
    active_campaigns = [],
    stage_counts = [],
    state_exposure = [],
    vendor_activity = [],
    recent_activity = []
  } = data;

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">

       <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6">
          <h1 className="text-3xl font-semibold">{firm.name}</h1>
          <p className="text-slate-400 mt-2">
            {firm.firm_type || "Firm"} • {firm.primary_state || "N/A"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m, i) => (
            <StatCard key={i} {...m} />
          ))}
        </div>

        {/* TEAM */}
        <Section title="Team">
          {team.length ? team.map(member => (
            <div key={member.id} className="p-3 bg-[#111827] rounded-xl">
              {member.first_name} {member.last_name}
            </div>
          )) : <EmptyState text="No team yet" />}
        </Section>

          <Section title="Active Campaigns">
          {active_campaigns.length ? active_campaigns.map(c => (
            <Link key={c.id} to={`/campaigns/${c.id}`}>
              <div className="p-3 bg-[#111827] rounded-xl">
                {c.campaign_name}
              </div>
            </Link>
          )) : <EmptyState text="No campaigns" />}
        </Section>

        <Section title="State Exposure">
          {state_exposure.length ? state_exposure.map(s => (
            <div key={s.state}>{s.state} ({s.count})</div>
          )) : <EmptyState text="No state data" />}
        </Section>

        <Section title="Vendor Activity">
          {vendor_activity.length ? vendor_activity.map(v => (
            <div key={v.id}>{v.vendor_name}</div>
          )) : <EmptyState text="No vendors" />}
        </Section>

        <Section title="Recent Activity">
          {recent_activity.length ? recent_activity.map(a => (
            <div key={a.id}>{a.summary}</div>
          )) : <EmptyState text="No activity" />}
        </Section>

      </div>
    </div>
  );
}
