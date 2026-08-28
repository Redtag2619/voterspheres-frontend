import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

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

function ReportsExecutiveHeader({
  summary,
  selectedReport,
  loading,
  generating,
  lastUpdated,
  onQuickGenerate,
  onRefresh,
}) {
  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        70 +
          Math.min(12, summary.total * 1.5) +
          Math.min(10, summary.generated_today * 3) +
          Math.min(8, summary.recommendations * 1.4) +
          Math.min(8, summary.signals * 1.1) -
          (loading ? 8 : 0) -
          (generating ? 4 : 0)
      )
    )
  );

  return (
    <div className="reports-exec-ribbon" id="reports-overview">
      <div className="reports-exec-copy">
        <span>Executive Reporting Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive reporting center for consultant-ready daily briefs, state intelligence,
          donor and fundraising reports, opposition watch, rapid response, and selected-report actions.
        </p>

        <div className="reports-exec-badges">
          <Badge tone="active">{summary.total} Reports</Badge>
          <Badge tone="info">{summary.generated_today} Generated Today</Badge>
          <Badge tone={summary.signals ? "demo" : "active"}>{summary.signals} Signals</Badge>
          <Badge tone="accent">{summary.recommendations} Recommendations</Badge>
          {selectedReport ? <Badge tone="active">{prettyType(selectedReport.report_type)}</Badge> : null}
        </div>
      </div>

      <div className="reports-exec-grid">
        <div><span>Selected Report</span><strong>{selectedReport?.title || "None"}</strong></div>
        <div><span>Report Status</span><strong>{selectedReport?.status || "Ready"}</strong></div>
        <div><span>AI Reporting</span><strong>{loading || generating ? "Working" : "Ready"}</strong></div>
        <div><span>Updated</span><strong>{lastUpdated || "Ready"}</strong></div>
      </div>

      <div className="reports-exec-actions">
        <button type="button" onClick={() => onQuickGenerate("executive_summary")} disabled={generating}>Executive Brief</button>
        <button type="button" onClick={() => onQuickGenerate("daily_brief")} disabled={generating}>Daily Brief</button>
        <button type="button" onClick={() => onQuickGenerate("rapid_response")} disabled={generating}>Rapid Response</button>
        <button type="button" onClick={onRefresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh Reports"}</button>
        <Link to="/ai-war-room">AI War Room</Link>
        <Link to="/command-center">Command Center</Link>
      </div>
    </div>
  );
}

function ReportsActionCenter({ selectedReport, onCopy, onDelete, onQuickGenerate, generating }) {
  return (
    <div className="reports-action-center">
      <button type="button" onClick={() => onQuickGenerate("executive_summary")} disabled={generating}>Generate Executive Brief</button>
      <button type="button" onClick={() => onQuickGenerate("daily_brief")} disabled={generating}>Generate Daily Brief</button>
      <button type="button" onClick={() => onQuickGenerate("state_report")} disabled={generating}>Generate State Report</button>
      <button type="button" onClick={() => onQuickGenerate("donor_report")} disabled={generating}>Generate Fundraising Report</button>
      <button type="button" onClick={() => onQuickGenerate("opposition_watch")} disabled={generating}>Generate Opposition Watch</button>
      <button type="button" onClick={onCopy} disabled={!selectedReport?.report_body}>Copy Selected Report</button>
      <button type="button" onClick={() => selectedReport?.id && onDelete(selectedReport.id)} disabled={!selectedReport?.id}>Delete Selected Report</button>
      <Link to="/ai-war-room">Open AI War Room</Link>
      <Link to="/command-center">Open Command Center</Link>
    </div>
  );
}

function SelectedReportBrief({ selectedReport, recommendations, signals }) {
  if (!selectedReport) return <EmptyState text="Select or generate a report to see its executive summary." />;

  const body = clean(selectedReport.report_body || selectedReport.executive_summary || "");
  const preview = body.length > 520 ? `${body.slice(0, 520)}...` : body;

  return (
    <div className="reports-ai-brief">
      <strong>{selectedReport.title}</strong>
      <p>{preview || "No executive report body available yet."}</p>
      <div className="reports-ai-brief-grid">
        <div><span>Type</span><b>{prettyType(selectedReport.report_type)}</b></div>
        <div><span>State</span><b>{selectedReport.state || "National"}</b></div>
        <div><span>Recommendations</span><b>{recommendations.length}</b></div>
        <div><span>Signals</span><b>{signals.length}</b></div>
      </div>
    </div>
  );
}

function RecommendationRow({ item }) {
  const text = typeof item === "string" ? item : item.title || item.action || item.recommendation || item.detail || "Recommended action";
  return (
    <div className="report-row">
      <ResponsiveRow
        title={clean(text)}
        subtitle={clean(item?.why || item?.summary || item?.description || "Review this recommended action.")}
        meta={[
          { label: "Type", value: item?.priority || item?.category || item?.type || "Recommendation" },
          { label: "Owner", value: item?.owner || "Executive Team" },
          { label: "State", value: item?.state || "National" },
          { label: "Status", value: item?.status || "Open" },
        ]}
        right={<Badge tone="accent">Action</Badge>}
      />
    </div>
  );
}

function SignalRow({ item }) {
  const text = typeof item === "string" ? item : item.title || item.signal || item.text || item.detail || "Intelligence signal";
  return (
    <div className="report-row">
      <ResponsiveRow
        title={clean(text)}
        subtitle={clean(item?.summary || item?.description || "Signal included in selected intelligence report.")}
        meta={[
          { label: "Source", value: item?.source || "Report" },
          { label: "State", value: item?.state || "National" },
          { label: "Risk", value: item?.risk || "Monitor" },
          { label: "Time", value: item?.time || "Latest" },
        ]}
        right={<Badge tone={item?.risk ? "demo" : "info"}>Signal</Badge>}
      />
    </div>
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

  function quickGenerate(reportType) {
    handleGenerate({
      report_type: reportType,
      state: selectedReport?.state || null,
      title: null,
    });
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

  const navSections = [
    { id: "reports-overview", label: "Overview" },
    { id: "reports-metrics", label: "Metrics" },
    { id: "reports-generate", label: "Generate" },
    { id: "reports-saved", label: "Saved Reports", badge: reports.length },
    { id: "reports-viewer", label: "Viewer" },
    { id: "reports-ai-brief", label: "AI Brief" },
    { id: "reports-recommendations", label: "Recommendations", badge: recommendations.length },
    { id: "reports-signals", label: "Signals", badge: signals.length },
    { id: "reports-actions", label: "Actions" },
  ];

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
        .reports-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .reports-exec-copy { min-width: 0; }

        .reports-exec-copy span,
        .reports-exec-grid span,
        .reports-ai-brief-grid span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .reports-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .reports-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .reports-exec-badges,
        .reports-exec-actions,
        .reports-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .reports-exec-badges { margin-top: 14px; }

        .reports-exec-grid,
        .reports-ai-brief-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .reports-exec-grid div,
        .reports-ai-brief-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .reports-exec-grid strong,
        .reports-ai-brief-grid b {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .reports-exec-actions {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .reports-exec-actions button,
        .reports-exec-actions a,
        .reports-action-center button,
        .reports-action-center a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .reports-exec-actions button:hover,
        .reports-exec-actions a:hover,
        .reports-action-center button:hover,
        .reports-action-center a:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .reports-exec-actions button:disabled,
        .reports-action-center button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .reports-exec-stack { display: grid; gap: 18px; min-width: 0; }

        .reports-ai-brief {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .reports-ai-brief strong {
          display: block;
          color: white;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .reports-ai-brief p {
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 14px;
        }


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
          .reports-grid,
          .reports-exec-ribbon {
            grid-template-columns: 1fr;
          }

          .reports-exec-grid,
          .reports-ai-brief-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="reports-exec-stack">
        <ReportsExecutiveHeader
          summary={summary}
          selectedReport={selectedReport}
          loading={loading}
          generating={generating}
          lastUpdated={lastUpdated}
          onQuickGenerate={quickGenerate}
          onRefresh={load}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="report-message">{message}</div> : null}

      <CollapsibleSection
        id="reports-metrics"
        title="Reporting Metrics"
        subtitle="Saved reports, daily generation volume, selected-report recommendations, and intelligence signals."
        defaultOpen
        right={<Badge tone="active">{summary.total} Reports</Badge>}
      >
      <div className="vs-grid-4">
        <StatCard label="Reports" value={fmt(summary.total)} delta="Saved reports" tone="up" />
        <StatCard label="Generated Today" value={fmt(summary.generated_today)} delta="Daily output" tone="up" />
        <StatCard label="Recommendations" value={fmt(summary.recommendations)} delta="In selected report" tone="neutral" />
        <StatCard label="Signals" value={fmt(summary.signals)} delta="In selected report" tone={summary.signals ? "down" : "up"} />
      </div>
      </CollapsibleSection>

      <div className="reports-grid">
        <div className="reports-stack">
          <CollapsibleSection id="reports-generate" title="Generate Report" subtitle="Create a new consultant-ready intelligence report." defaultOpen>
            <ReportForm onGenerate={handleGenerate} generating={generating} />
          </CollapsibleSection>

          <CollapsibleSection id="reports-saved" title="Saved Reports" subtitle="Previously generated reports." right={<Badge tone="accent">{reports.length}</Badge>}>
            {loading ? (
              <EmptyState text="Loading reports..." />
            ) : !reports.length ? (
              <EmptyState text="No intelligence reports generated yet." />
            ) : (
              <div className="reports-stack">
                <ShowMoreList
                  items={reports}
                  initialCount={10}
                  showAllLabel={(count) => `Show All ${count} Reports`}
                  className="reports-stack"
                  renderItem={(report) => (
                    <div className="report-row" onClick={() => openReport(report.id)}>
                      <ResponsiveRow
                        title={report.title}
                        subtitle={clean(report.executive_summary || "Generated intelligence report")}
                        meta={[
                          { label: "Type", value: prettyType(report.report_type) },
                          { label: "State", value: report.state || "National" },
                          { label: "Status", value: report.status || "generated" },
                          { label: "Created", value: report.created_at ? new Date(report.created_at).toLocaleDateString() : "â€”" },
                        ]}
                        right={<Badge tone="active">Open</Badge>}
                      />
                    </div>
                  )}
                />
              </div>
            )}
          </CollapsibleSection>
        </div>

        <div className="reports-stack">
          <CollapsibleSection
            id="reports-viewer"
            title={selectedReport?.title || "Report Viewer"}
            subtitle={selectedReport ? `${prettyType(selectedReport.report_type)} ${selectedReport.state || "National"}` : "Generate or select a report."}
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
          </CollapsibleSection>

          <CollapsibleSection
            id="reports-ai-brief"
            title="AI Executive Report Brief"
            subtitle="Readable summary and metadata for the selected intelligence report."
            defaultOpen={false}
            right={<Badge tone="info">AI Summary</Badge>}
          >
            <SelectedReportBrief
              selectedReport={selectedReport}
              recommendations={recommendations}
              signals={signals}
            />
          </CollapsibleSection>
        </div>
      </div>

      <div className="vs-grid-2">
        <CollapsibleSection
          id="reports-recommendations"
          title="Recommended Actions"
          subtitle="Action items extracted from the selected intelligence report."
          defaultOpen={false}
          right={<Badge tone="accent">{recommendations.length}</Badge>}
        >
          {!recommendations.length ? (
            <EmptyState text="No recommended actions in the selected report." />
          ) : (
            <ShowMoreList
              items={recommendations}
              initialCount={8}
              showAllLabel={(count) => `Show All ${count} Recommendations`}
              className="reports-stack"
              renderItem={(item) => <RecommendationRow item={item} />}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection
          id="reports-signals"
          title="Intelligence Signals"
          subtitle="Signals included in the selected intelligence report."
          defaultOpen={false}
          right={<Badge tone={signals.length ? "demo" : "active"}>{signals.length}</Badge>}
        >
          {!signals.length ? (
            <EmptyState text="No intelligence signals in the selected report." />
          ) : (
            <ShowMoreList
              items={signals}
              initialCount={8}
              showAllLabel={(count) => `Show All ${count} Signals`}
              className="reports-stack"
              renderItem={(item) => <SignalRow item={item} />}
            />
          )}
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="reports-actions"
        title="Executive Action Center"
        subtitle="Generate common reports and move into connected command modules."
        defaultOpen={false}
        right={<Badge tone="active">Report Handoff</Badge>}
      >
        <ReportsActionCenter
          selectedReport={selectedReport}
          onCopy={copyReport}
          onDelete={deleteReport}
          onQuickGenerate={quickGenerate}
          generating={generating}
        />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
