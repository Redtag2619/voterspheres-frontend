import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.exports)) return value.exports;
  if (Array.isArray(value?.reports)) return value.reports;
  return [];
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function clean(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function pretty(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function ExportForm({ reports, onGenerate, generating }) {
  const [form, setForm] = useState({
    report_id: "",
    export_type: "client_brief",
    title: "",
  });

  useEffect(() => {
    if (!form.report_id && reports[0]?.id) {
      setForm((prev) => ({ ...prev, report_id: String(reports[0].id) }));
    }
  }, [reports, form.report_id]);

  function submit(event) {
    event.preventDefault();
    onGenerate?.({
      report_id: form.report_id,
      export_type: form.export_type,
      title: form.title || null,
    });
  }

  return (
    <form className="export-form" onSubmit={submit}>
      <select
        required
        value={form.report_id}
        onChange={(e) => setForm({ ...form, report_id: e.target.value })}
      >
        <option value="">Select source intelligence report</option>
        {reports.map((report) => (
          <option key={report.id} value={report.id}>
            {report.title}
          </option>
        ))}
      </select>

      <select
        value={form.export_type}
        onChange={(e) => setForm({ ...form, export_type: e.target.value })}
      >
        <option value="client_brief">Client PDF Brief</option>
        <option value="donor_memo">Donor Memo</option>
        <option value="situation_report">Campaign Situation Report</option>
      </select>

      <input
        placeholder="Custom export title optional"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <button className="vs-button" disabled={generating || !form.report_id}>
        {generating ? "Generating..." : "Generate Export"}
      </button>
    </form>
  );
}

export default function ReportExportCenter() {
  const [reports, setReports] = useState([]);
  const [exportsList, setExportsList] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [reportsResult, exportsResult] = await Promise.all([
        api.intelligenceReports(),
        api.reportExports(),
      ]);

      const reportRows = arr(reportsResult);
      const exportRows = arr(exportsResult);

      setReports(reportRows);
      setExportsList(exportRows);

      if (!selectedExport && exportRows[0]?.id) {
        const detail = await api.reportExport(exportRows[0].id);
        setSelectedExport(detail?.export || null);
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load report export center."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedExport]);

  useEffect(() => {
    load();
  }, [load]);

  async function generateExport(payload) {
    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const result = await api.generateReportExport(payload);
      setSelectedExport(result?.export || null);
      setMessage("Report export generated.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to generate report export."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function openExport(id) {
    try {
      const result = await api.reportExport(id);
      setSelectedExport(result?.export || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to open report export.");
    }
  }

  async function copyExport() {
    if (!selectedExport?.export_body) return;
    await navigator.clipboard.writeText(selectedExport.export_body);
    setMessage("Export copied to clipboard.");
  }

  async function copyHtml() {
    if (!selectedExport?.html_body) return;
    await navigator.clipboard.writeText(selectedExport.html_body);
    setMessage("HTML export copied. Paste into browser or print to PDF.");
  }

  async function copyDeck() {
    const deck = selectedExport?.deck_outline || [];
    if (!deck.length) return;
    await navigator.clipboard.writeText(JSON.stringify(deck, null, 2));
    setMessage("Deck outline copied.");
  }

  function printExport() {
    if (!selectedExport?.html_body) return;

    const win = window.open("", "_blank");
    win.document.write(selectedExport.html_body);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  async function deleteExport(id) {
    try {
      await api.deleteReportExport(id);
      setSelectedExport(null);
      setMessage("Export deleted.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to delete export.");
    }
  }

  const deckOutline = arr(selectedExport?.deck_outline);

  const summary = useMemo(() => {
    return {
      reports: reports.length,
      exports: exportsList.length,
      client_briefs: exportsList.filter((item) => item.export_type === "client_brief").length,
      donor_memos: exportsList.filter((item) => item.export_type === "donor_memo").length,
    };
  }, [reports, exportsList]);

  return (
    <PageShell
      eyebrow="Report Export Engine"
      title="Report Export Center"
      description="Turn intelligence reports into client-ready briefs, donor memos, printable PDF-ready HTML, and PowerPoint deck outlines."
      tickerItems={[
        { label: "Reports", value: `${summary.reports}`, dotClass: "vs-live-dot-success" },
        { label: "Exports", value: `${summary.exports}`, dotClass: "vs-live-dot-success" },
        { label: "Client Briefs", value: `${summary.client_briefs}`, dotClass: "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .export-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.28fr);
          gap: 18px;
          align-items: start;
        }

        .export-stack {
          display: grid;
          gap: 14px;
        }

        .export-form {
          display: grid;
          gap: 10px;
        }

        .export-form input,
        .export-form select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .export-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          overflow: hidden;
          cursor: pointer;
        }

        .export-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .export-doc {
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
          max-height: 680px;
          overflow: auto;
        }

        .export-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          margin-bottom: 14px;
        }

        .export-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
        }

        .deck-slide {
          border-radius: 18px;
          border: 1px solid rgba(96, 165, 250, 0.22);
          background: rgba(37, 99, 235, 0.12);
          padding: 14px;
          color: rgba(226, 232, 240, 0.92);
        }

        .deck-slide strong {
          display: block;
          color: white;
          margin-bottom: 8px;
        }

        .deck-slide ul {
          margin: 0;
          padding-left: 18px;
        }

        @media (max-width: 1100px) {
          .export-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="export-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Source Reports" value={fmt(summary.reports)} delta="Available reports" tone="up" />
        <StatCard label="Exports" value={fmt(summary.exports)} delta="Generated deliverables" tone="up" />
        <StatCard label="Client Briefs" value={fmt(summary.client_briefs)} delta="PDF-ready briefs" tone="up" />
        <StatCard label="Donor Memos" value={fmt(summary.donor_memos)} delta="Finance deliverables" tone="up" />
      </div>

      <div className="export-grid">
        <div className="export-stack">
          <SectionCard title="Generate Export" subtitle="Create a client-ready deliverable from an intelligence report.">
            <ExportForm reports={reports} onGenerate={generateExport} generating={generating} />
          </SectionCard>

          <SectionCard title="Saved Exports" subtitle="Previously generated deliverables." right={<Badge tone="accent">{exportsList.length}</Badge>}>
            {loading ? (
              <EmptyState text="Loading exports..." />
            ) : !exportsList.length ? (
              <EmptyState text="No report exports generated yet." />
            ) : (
              <div className="export-stack">
                {exportsList.map((item) => (
                  <div key={item.id} className="export-row" onClick={() => openExport(item.id)}>
                    <ResponsiveRow
                      title={item.title}
                      subtitle={item.metadata?.source_report_title || "Generated export"}
                      meta={[
                        { label: "Type", value: pretty(item.export_type) },
                        { label: "Status", value: item.status || "generated" },
                        { label: "Report", value: item.report_id || "—" },
                        { label: "Created", value: item.created_at ? new Date(item.created_at).toLocaleDateString() : "—" },
                      ]}
                      right={<Badge tone="active">Open</Badge>}
                    />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Deck Outline" subtitle="PowerPoint-ready structure for the selected export.">
            {!deckOutline.length ? (
              <EmptyState text="No deck outline available." />
            ) : (
              <div className="export-stack">
                {deckOutline.map((slide) => (
                  <div key={slide.slide} className="deck-slide">
                    <strong>Slide {slide.slide}: {slide.title}</strong>
                    <ul>
                      {arr(slide.bullets).map((bullet, index) => (
                        <li key={`${bullet}-${index}`}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="export-stack">
          <SectionCard
            title={selectedExport?.title || "Export Viewer"}
            subtitle={selectedExport ? `${pretty(selectedExport.export_type)} • PDF-ready HTML and deck outline` : "Generate or select an export."}
            right={selectedExport ? <Badge tone="active">{selectedExport.status || "generated"}</Badge> : null}
          >
            {!selectedExport ? (
              <EmptyState text="No export selected." />
            ) : (
              <>
                <div className="export-actions">
                  <button className="vs-button" onClick={copyExport}>Copy Text</button>
                  <button className="vs-button vs-button-secondary" onClick={copyHtml}>Copy HTML</button>
                  <button className="vs-button vs-button-secondary" onClick={copyDeck}>Copy Deck</button>
                  <button className="vs-button vs-button-secondary" onClick={printExport}>Print / Save PDF</button>
                  <button className="vs-button vs-button-secondary" onClick={() => deleteExport(selectedExport.id)}>Delete</button>
                </div>

                <div className="export-doc">
                  {clean(selectedExport.export_body)}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
