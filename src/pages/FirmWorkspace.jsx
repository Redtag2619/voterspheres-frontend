import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data;
}

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
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          ) : null}
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
      const response = await apiRequest(`/api/firms/${id}/workspace`);
      setData(response);
    } catch (err) {
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

  const { firm, metrics, team, active_campaigns, stage_counts, state_exposure, vendor_activity, recent_activity } = data;

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Firm Workspace
              </div>
              <h1 className="mt-2 text-3xl font-semibold">{firm.name}</h1>
              <p className="mt-2 text-sm text-slate-400">
                {firm.firm_type || "Firm"} • {firm.primary_state || "State N/A"}
              </p>
            </div>

            <div className="grid gap-2 text-sm text-slate-300">
              <div>
                <span className="text-slate-500">Slug:</span> {firm.slug}
              </div>
              <div>
                <span className="text-slate-500">Website:</span>{" "}
                {firm.website ? (
                  <a
                    href={firm.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    {firm.website}
                  </a>
                ) : (
                  "N/A"
                )}
              </div>
            </div>
          </div>

          {firm.description ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300">
              {firm.description}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(metrics || []).map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Team" subtitle="Users assigned to this firm">
            <div className="space-y-3">
              {team?.length ? (
                team.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="font-semibold text-white">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {member.title || member.role || "Team member"}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {member.email}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No firm users yet." />
              )}
            </div>
          </Section>

          <Section title="Pipeline Stage Distribution" subtitle="Campaign counts by stage">
            <div className="grid gap-3 md:grid-cols-2">
              {stage_counts?.length ? (
                stage_counts.map((row) => (
                  <div
                    key={row.stage}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      {row.stage}
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-white">
                      {row.count}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No stage data yet." />
              )}
            </div>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section
            title="Active Campaigns"
            subtitle="Open client workspaces"
            right={
              <Link
                to="/campaigns"
                className="text-sm text-cyan-300 hover:text-cyan-200"
              >
                View pipeline
              </Link>
            }
          >
            <div className="space-y-3">
              {active_campaigns?.length ? (
                active_campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/campaigns/${campaign.id}`}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4 transition hover:border-cyan-400/30 md:grid-cols-[1.5fr,1fr,auto]"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {campaign.campaign_name}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {campaign.candidate_name}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300">
                      <div>{campaign.stage || "N/A"}</div>
                      <div className="mt-1 text-slate-500">
                        {campaign.state || "N/A"} • {campaign.office || "N/A"}
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-white">
                      ${Number(campaign.contract_value || 0).toLocaleString()}
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState text="No active campaigns yet." />
              )}
            </div>
          </Section>

          <Section title="State Exposure" subtitle="Where this firm is active">
            <div className="space-y-3">
              {state_exposure?.length ? (
                state_exposure.map((row) => (
                  <div
                    key={row.state}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="font-medium text-white">{row.state}</div>
                    <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                      {row.count} campaign{row.count === 1 ? "" : "s"}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No state exposure data yet." />
              )}
            </div>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Vendor Activity" subtitle="Recent vendors used by this firm">
            <div className="space-y-3">
              {vendor_activity?.length ? (
                vendor_activity.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">
                          {vendor.vendor_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          {vendor.category || "Vendor"} • {vendor.campaign_name}
                        </div>
                      </div>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                        {vendor.status || "prospect"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No vendor activity yet." />
              )}
            </div>
          </Section>

          <Section title="Recent CRM Activity" subtitle="Latest events across the firm">
            <div className="space-y-3">
              {recent_activity?.length ? (
                recent_activity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="font-medium text-white">{item.summary}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {item.campaign_name} • {item.activity_type}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No recent activity yet." />
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
