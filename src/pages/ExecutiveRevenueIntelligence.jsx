import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function pct(value) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["at risk", "at_risk", "high", "overdue"].includes(v)) return "danger";
  if (["watch", "medium", "stable"].includes(v)) return "demo";
  if (["strong", "low"].includes(v)) return "active";
  return "accent";
}

function RecommendationRow({ item }) {
  return (
    <div className="revenue-row">
      <ResponsiveRow
        title={item.title}
        subtitle={item.why}
        meta={[
          { label: "Category", value: item.category },
          { label: "Priority", value: item.priority },
          { label: "Action", value: item.action },
          { label: "Source", value: "Revenue AI" },
        ]}
        right={<Badge tone={tone(item.priority)}>{item.priority}</Badge>}
      />
    </div>
  );
}

export default function ExecutiveRevenueIntelligence() {
  const [data, setData] = useState({
    summary: {},
    revenue_by_client: [],
    project_margins: [],
    staff_utilization: [],
    at_risk_clients: [],
    overdue_invoices: [],
    recommendations: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.executiveRevenueIntelligence();

      setData({
        summary: result?.summary || {},
        revenue_by_client: arr(result?.revenue_by_client),
        project_margins: arr(result?.project_margins),
        staff_utilization: arr(result?.staff_utilization),
        at_risk_clients: arr(result?.at_risk_clients),
        overdue_invoices: arr(result?.overdue_invoices),
        recommendations: arr(result?.recommendations),
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load Executive Revenue Intelligence.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const summary = data.summary || {};
  const revenueByClient = arr(data.revenue_by_client);
  const projectMargins = arr(data.project_margins);
  const staff = arr(data.staff_utilization);
  const recommendations = arr(data.recommendations);

  const marginTone = useMemo(() => {
    if (Number(summary.gross_margin || 0) < 15) return "danger";
    if (Number(summary.gross_margin || 0) < 35) return "demo";
    return "active";
  }, [summary]);

  return (
    <PageShell
      eyebrow="Executive Revenue Intelligence"
      title="Executive Revenue Intelligence"
      description="CEO-level revenue command layer for retainers, ARR, receivables, forecast revenue, project margin, client health, and staff utilization."
      tickerItems={[
        { label: "Revenue Health", value: summary.revenue_health_status || "Stable", dotClass: ["At Risk", "Watch"].includes(summary.revenue_health_status) ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "MRR", value: currency(summary.mrr), dotClass: "vs-live-dot-success" },
        { label: "ARR", value: currency(summary.arr), dotClass: "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .revenue-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, .75fr);
          gap: 18px;
          align-items: start;
        }

        .revenue-stack {
          display: grid;
          gap: 14px;
        }

        .revenue-hero {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(16, 185, 129, 0.20), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.18), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.84));
          padding: 22px;
        }

        .revenue-hero-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .revenue-hero h2 {
          margin: 0;
          color: white;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .revenue-hero p {
          margin: 10px 0 0;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.6;
        }

        .revenue-health {
          margin-top: 18px;
          color: white;
          font-size: 72px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.08em;
        }

        .revenue-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .revenue-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .revenue-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .revenue-mini-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .revenue-mini-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, .14);
          background: rgba(2, 6, 23, .38);
          padding: 12px;
        }

        .revenue-mini-grid span {
          display: block;
          color: rgba(203, 213, 225, .62);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .revenue-mini-grid strong {
          display: block;
          margin-top: 6px;
          color: white;
          font-size: 22px;
          font-weight: 950;
        }

        @media (max-width: 1100px) {
          .revenue-grid,
          .revenue-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="MRR" value={currency(summary.mrr)} delta="Monthly retainers" tone="up" />
        <StatCard label="ARR" value={currency(summary.arr)} delta="Annualized retainers" tone="up" />
        <StatCard label="Open Receivables" value={currency(summary.open_receivables)} delta={`${summary.overdue_invoices || 0} overdue`} tone={summary.open_receivables ? "neutral" : "up"} />
        <StatCard label="Gross Margin" value={pct(summary.gross_margin)} delta="Projected blended margin" tone={marginTone === "active" ? "up" : "down"} />
      </div>

      {loading ? (
        <EmptyState text="Loading Executive Revenue Intelligence..." />
      ) : (
        <div className="revenue-grid">
          <div className="revenue-stack">
            <div className="revenue-hero">
              <div className="revenue-hero-top">
                <div>
                  <h2>Revenue Command View</h2>
                  <p>
                    Executive-level visibility into revenue health, client risk,
                    receivables, project profitability, staff utilization, and forecast revenue.
                  </p>
                </div>

                <Badge tone={tone(summary.revenue_health_status)}>{summary.revenue_health_status || "Stable"}</Badge>
              </div>

              <div className="revenue-health">{pct(summary.revenue_health_score || 0)}</div>

              <div className="revenue-mini-grid">
                <div><span>30-Day Forecast</span><strong>{currency(summary.forecast_30)}</strong></div>
                <div><span>90-Day Forecast</span><strong>{currency(summary.forecast_90)}</strong></div>
                <div><span>Annual Forecast</span><strong>{currency(summary.forecast_annual)}</strong></div>
              </div>

              <div className="revenue-actions">
                <Link className="vs-button" to="/business-suite">Business Suite</Link>
                <Link className="vs-button vs-button-secondary" to="/client-portal-admin">Client Portals</Link>
                <Link className="vs-button vs-button-secondary" to="/report-exports">Report Exports</Link>
                <button className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <SectionCard
              title="Revenue By Client"
              subtitle="Retainer value, invoice revenue, unpaid balance, and client risk."
              right={<Badge tone="accent">{revenueByClient.length}</Badge>}
            >
              <div className="revenue-stack">
                {!revenueByClient.length ? (
                  <EmptyState text="No client revenue records yet." />
                ) : (
                  revenueByClient.slice(0, 12).map((client) => (
                    <div key={client.id} className="revenue-row">
                      <ResponsiveRow
                        title={client.client_name}
                        subtitle={`${client.organization || "Client"} • ${client.state || "National"}`}
                        meta={[
                          { label: "Total Value", value: currency(client.total_value) },
                          { label: "MRR", value: currency(client.monthly_retainer) },
                          { label: "Unpaid", value: currency(client.unpaid_balance) },
                          { label: "Health", value: client.health_status },
                        ]}
                        right={<Badge tone={tone(client.health_status)}>{client.health_status}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Project Margin"
              subtitle="Projected revenue, actual cost, and profitability risk."
              right={<Badge tone="accent">{projectMargins.length}</Badge>}
            >
              <div className="revenue-stack">
                {!projectMargins.length ? (
                  <EmptyState text="No project margin records yet." />
                ) : (
                  projectMargins.slice(0, 12).map((project) => (
                    <div key={project.id} className="revenue-row">
                      <ResponsiveRow
                        title={project.project_name}
                        subtitle={`${project.client_name || "No client"} • Owner: ${project.owner || "Unassigned"}`}
                        meta={[
                          { label: "Revenue", value: currency(project.projected_revenue) },
                          { label: "Cost", value: currency(project.actual_cost) },
                          { label: "Margin", value: pct(project.margin) },
                          { label: "Risk", value: project.risk },
                        ]}
                        right={<Badge tone={tone(project.risk)}>{project.risk}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <div className="revenue-stack">
            <SectionCard
              title="Executive Recommendations"
              subtitle="Revenue and profitability actions."
              right={<Badge tone={recommendations.length ? "demo" : "active"}>{recommendations.length}</Badge>}
            >
              <div className="revenue-stack">
                {!recommendations.length ? (
                  <EmptyState text="No recommendations available." />
                ) : (
                  recommendations.map((item, index) => (
                    <RecommendationRow key={`${item.title}-${index}`} item={item} />
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Staff Utilization"
              subtitle="Billable utilization and revenue contribution."
              right={<Badge tone="accent">{staff.length}</Badge>}
            >
              <div className="revenue-stack">
                {!staff.length ? (
                  <EmptyState text="No staff utilization records yet." />
                ) : (
                  staff.slice(0, 10).map((person) => (
                    <div key={person.staff_name} className="revenue-row">
                      <ResponsiveRow
                        title={person.staff_name}
                        subtitle={person.role || "Staff"}
                        meta={[
                          { label: "Utilization", value: pct(person.utilization_rate) },
                          { label: "Billable", value: person.billable_hours },
                          { label: "Non-Billable", value: person.non_billable_hours },
                          { label: "Revenue", value: currency(person.revenue) },
                        ]}
                        right={<Badge tone={person.utilization_rate >= 70 ? "active" : "demo"}>{pct(person.utilization_rate)}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Risk Watch"
              subtitle="At-risk clients and overdue invoices."
              right={<Badge tone={(data.at_risk_clients.length || data.overdue_invoices.length) ? "danger" : "active"}>{data.at_risk_clients.length + data.overdue_invoices.length}</Badge>}
            >
              <div className="revenue-stack">
                {!data.at_risk_clients.length && !data.overdue_invoices.length ? (
                  <EmptyState text="No revenue risk items detected." />
                ) : null}

                {data.at_risk_clients.slice(0, 5).map((client) => (
                  <div key={`client-${client.id}`} className="revenue-row">
                    <ResponsiveRow
                      title={client.client_name}
                      subtitle="Client health watch"
                      meta={[
                        { label: "Health", value: client.health_status },
                        { label: "Score", value: pct(client.health_score) },
                        { label: "Retainer", value: currency(client.monthly_retainer) },
                        { label: "Unpaid", value: currency(client.unpaid_balance) },
                      ]}
                      right={<Badge tone="danger">Client Risk</Badge>}
                    />
                  </div>
                ))}

                {data.overdue_invoices.slice(0, 5).map((invoice) => (
                  <div key={`invoice-${invoice.id}`} className="revenue-row">
                    <ResponsiveRow
                      title={invoice.title}
                      subtitle={invoice.client_name || "Invoice overdue"}
                      meta={[
                        { label: "Amount", value: currency(invoice.amount) },
                        { label: "Status", value: invoice.status },
                        { label: "Due", value: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—" },
                        { label: "Created", value: invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "—" },
                      ]}
                      right={<Badge tone="danger">Overdue</Badge>}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
