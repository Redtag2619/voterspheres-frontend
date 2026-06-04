import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.reports)) return value.reports;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function clean(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function prettyType(value = "") {
  return String(value || "daily_brief")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function ReportForm({ onGenerate, generating }) {
  const [form, setForm] = useState({
    report_type: "daily_brief",
    state: "",
    title: "",
  });

  function submit(event) {
    event.preventDefault();
    onGenerate?.({
      report_type: form.report_type,
      state: form.state || null,
      title: form.title || null,
    });
  }

  return (
    <form className="reports-form" onSubmit={submit}>
      <select
        value={form.report_type}
        onChange={(e) => setForm({ ...form, report_type: e.target.value })}
      >
        <option value="daily_brief">Daily Intelligence Brief</option>
        <option value="executive_summary">Executive Summary</option>
        <option value="state_report">State Intelligence Report</option>
        <option value="donor_report">Donor & Fundraising Report</option>
        <option value="opposition_watch">Opposition Watch Report</option>
        <option value="rapid_response">Rapid Response Brief</option>
      </select>

      <input
        placeholder="State optional, example: PA"
        value={form.state}
        onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
      />

      <input
        placeholder="Custom title optional"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <button className="vs-button" disabled={generating}>
        {generating ? "Generating..." : "Generate Report"}
      </button>
    </form>
  );
}

export default function IntelligenceReports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.intelligenceReports();
      const rows = arr(result);
      setReports(rows);

      if (!selectedReport && rows[0]?.id) {
        const detail = await api.intelligenceReport(rows[0].id);
        setSelectedReport(detail?.report || null);
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load intelligence reports."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedReport]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate(payload) {
    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const result = await api.generateIntelligenceReport(payload);
      const report = result?.report;

      setSelectedReport(report || null);
      setMessage("Intelligence report generated.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to generate report."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function openReport(id) {
    try {
      setError("");
      const result = await api.intelligenceReport(id);
      setSelectedReport(result?.report || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to open report.");
    }
  }

  async function copyReport() {
    if (!selectedReport?.report_body) return;

    await navigator.clipboard.writeText(selectedReport.report_body);
    setMessage("Report copied to clipboard.");
  }

  async function deleteReport(id) {
    try {
      await api.deleteIntelligenceReport(id);
      setSelectedReport(null);
      setMessage("Report deleted.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to delete report.");
    }
  }

  const selectedSections = selectedReport?.sections || {};
  const recommendations = arr(selectedSections.recommended_actions);
  const signals = arr(selectedSections.signals);

  const summary = useMemo(() => {
    return {
      total: reports.length,
      generated_today: reports.filter((item) => {
        const d = item.created_at ? new Date(item.created_at) : null;
        return d && d.toDateString() === new Date().toDateString();
      }).length,
      recommendations: recommendations.length,
      signals: signals.length,
    };
  }, [reports, recommendations, signals]);

  return (
    <PageShell
      eyebrow="Automated Intelligence Reports"
      title="Intelligence Report Generator"
      description="Generate consultant-ready daily briefs, state reports, executive summaries, donor reports, opposition watch reports, and rapid response briefs."
      tickerItems={[
        { label: "Reports", value: `${summary.total}`, dotClass: "vs-live-dot-success" },
        { label: "Generated Today", value: `${summary.generated_today}`, dotClass: "vs-live-dot-success" },
        { label: "Signals", value: `${summary.signals}`, dotClass: summary.signals ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .reports-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
          gap: 18px;
          align-items: start;
        }

        .reports-stack {
          display: grid;
          gap: 14px;
        }

        .reports-form {
          display: grid;
          gap: 10px;
        }

        .reports-form input,
        .reports-form select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .report-doc {
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.62));
          padding: 20px;
          white-space: pre-wrap;
          color: rgba(226, 232, 240, 0.92);
          font-size: 13px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .report-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          overflow: hidden;
          cursor: pointer;
        }

        .report-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .report-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          margin-bottom: 14px;
        }

        .report-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
        }

        @media (max-width: 1100px) {
          .reports-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="report-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Reports" value={fmt(summary.total)} delta="Saved reports" tone="up" />
        <StatCard label="Generated Today" value={fmt(summary.generated_today)} delta="Daily output" tone="up" />
        <StatCard label="Recommendations" value={fmt(summary.recommendations)} delta="In selected report" tone="neutral" />
        <StatCard label="Signals" value={fmt(summary.signals)} delta="In selected report" tone={summary.signals ? "down" : "up"} />
      </div>

      <div className="reports-grid">
        <div className="reports-stack">
          <SectionCard title="Generate Report" subtitle="Create a new consultant-ready intelligence report.">
            <ReportForm onGenerate={handleGenerate} generating={generating} />
          </SectionCard>

          <SectionCard title="Saved Reports" subtitle="Previously generated reports." right={<Badge tone="accent">{reports.length}</Badge>}>
            {loading ? (
              <EmptyState text="Loading reports..." />
            ) : !reports.length ? (
              <EmptyState text="No intelligence reports generated yet." />
            ) : (
              <div className="reports-stack">
                {reports.map((report) => (
                  <div key={report.id} className="report-row" onClick={() => openReport(report.id)}>
                    <ResponsiveRow
                      title={report.title}
                      subtitle={clean(report.executive_summary || "Generated intelligence report")}
                      meta={[
                        { label: "Type", value: prettyType(report.report_type) },
                        { label: "State", value: report.state || "National" },
                        { label: "Status", value: report.status || "generated" },
                        { label: "Created", value: report.created_at ? new Date(report.created_at).toLocaleDateString() : "—" },
                      ]}
                      right={<Badge tone="active">Open</Badge>}
                    />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="reports-stack">
          <SectionCard
            title={selectedReport?.title || "Report Viewer"}
            subtitle={selectedReport ? `${prettyType(selectedReport.report_type)} • ${selectedReport.state || "National"}` : "Generate or select a report."}
            right={selectedReport ? <Badge tone="active">{selectedReport.status || "generated"}</Badge> : null}
          >
            {!selectedReport ? (
              <EmptyState text="No report selected." />
            ) : (
              <>
                <div className="report-actions">
                  <button className="vs-button" onClick={copyReport}>Copy Report</button>
                  <button className="vs-button vs-button-secondary" onClick={() => deleteReport(selectedReport.id)}>Delete</button>
                </div>

                <div className="report-doc">
                  {selectedReport.report_body}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
