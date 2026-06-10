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

function tone(value) {
  const v = String(value || "").toLowerCase();

  if (["blocked", "critical"].includes(v)) return "danger";
  if (["draft", "review", "high", "medium"].includes(v)) return "demo";
  if (["ready", "published", "low"].includes(v)) return "active";

  return "accent";
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const emptyForm = {
  asset_key: "",
  title: "",
  category: "Launch",
  status: "draft",
  owner: "Founder",
  priority: "medium",
  route: "",
  due_date: "",
  content: "",
  notes: "",
};

export default function LaunchAssetCenter() {
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    status: "",
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const [data, setData] = useState({
    summary: {},
    categories: [],
    assets: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.launchAssets(filters);

      setData({
        summary: result?.summary || {},
        categories: arr(result?.categories),
        assets: arr(result?.assets),
      });

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load Launch Asset Center."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, []);

  const summary = data.summary || {};
  const assets = arr(data.assets);
  const categories = arr(data.categories);

  const grouped = useMemo(() => {
    return assets.reduce((acc, item) => {
      const key = item.category || "Other";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [assets]);

  const topAsset = useMemo(() => {
    return (
      assets.find((item) => item.status === "blocked") ||
      assets.find((item) => item.priority === "critical") ||
      assets.find((item) => item.priority === "high" && item.status !== "ready" && item.status !== "published") ||
      assets[0]
    );
  }, [assets]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function editAsset(asset) {
    setEditingId(asset.id);
    setForm({
      asset_key: asset.asset_key || "",
      title: asset.title || "",
      category: asset.category || "Launch",
      status: asset.status || "draft",
      owner: asset.owner || "Founder",
      priority: asset.priority || "medium",
      route: asset.route || "",
      due_date: asset.due_date ? String(asset.due_date).slice(0, 10) : "",
      content: asset.content || "",
      notes: asset.notes || "",
    });
  }

  async function submitForm(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const result = await api.saveLaunchAsset(form);
      setMessage(result?.message || "Launch asset saved.");

      resetForm();
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to save launch asset."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(asset, status) {
    try {
      setActionLoading(`status-${asset.id}`);
      setError("");
      setMessage("");

      const result = await api.updateLaunchAssetStatus(asset.id, status);
      setMessage(result?.message || "Asset status updated.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to update launch asset status."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function deleteAsset(asset) {
    const ok = window.confirm(`Delete ${asset.title}?`);
    if (!ok) return;

    try {
      setActionLoading(`delete-${asset.id}`);
      setError("");
      setMessage("");

      const result = await api.deleteLaunchAsset(asset.id);
      setMessage(result?.message || "Launch asset deleted.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to delete launch asset."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function runSearch(event) {
    event.preventDefault();
    await load();
  }

  return (
    <PageShell
      eyebrow="Go-To-Market Readiness"
      title="Launch Asset Center"
      description="Manage the launch materials VoterSpheres needs to sell, demo, onboard, and launch: landing copy, pricing copy, demo script, beta invites, sales one-pager, product tour, launch checklist, and onboarding assets."
      tickerItems={[
        { label: "Assets", value: `${summary.total || 0}`, dotClass: "vs-live-dot-success" },
        {
          label: "Ready",
          value: `${Number(summary.ready || 0) + Number(summary.published || 0)}`,
          dotClass: summary.readiness_score >= 80 ? "vs-live-dot-success" : "vs-live-dot-warning",
        },
        {
          label: "Readiness",
          value: `${summary.readiness_score || 0}%`,
          dotClass: summary.readiness_score >= 80 ? "vs-live-dot-success" : "vs-live-dot-warning",
        },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .asset-grid {
          display: grid;
          grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
          gap: 18px;
          align-items: start;
        }

        .asset-stack {
          display: grid;
          gap: 14px;
        }

        .asset-command {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .88));
          padding: 24px;
          box-shadow: 0 18px 60px rgba(0,0,0,.32);
        }

        .asset-score {
          margin-top: 14px;
          color: white;
          font-size: clamp(50px, 8vw, 92px);
          line-height: .94;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .asset-title {
          margin: 12px 0 0;
          color: white;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -.05em;
          line-height: 1.05;
        }

        .asset-sub {
          margin-top: 10px;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.65;
        }

        .asset-form {
          display: grid;
          gap: 10px;
        }

        .asset-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .asset-form input,
        .asset-form select,
        .asset-form textarea {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .74);
          color: white;
          padding: 11px 12px;
          width: 100%;
        }

        .asset-form textarea {
          min-height: 110px;
          resize: vertical;
        }

        .asset-actions,
        .asset-button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .asset-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .asset-row.blocked {
          border-color: rgba(248, 113, 113, .4);
        }

        .asset-row.ready,
        .asset-row.published {
          border-color: rgba(34, 197, 94, .28);
        }

        .asset-row.review,
        .asset-row.draft {
          border-color: rgba(251, 146, 60, .3);
        }

        .asset-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .asset-mini-button {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .72);
          color: rgba(226, 232, 240, .88);
          font-size: 11px;
          font-weight: 800;
          padding: 7px 9px;
          cursor: pointer;
        }

        .asset-mini-button:hover {
          border-color: rgba(251, 146, 60, .38);
          background: rgba(251, 146, 60, .12);
        }

        @media (max-width: 1180px) {
          .asset-grid,
          .asset-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-banner-demo">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Asset Readiness" value={`${summary.readiness_score || 0}%`} delta="Ready / published" tone={summary.readiness_score >= 80 ? "up" : "neutral"} />
        <StatCard label="Draft / Review" value={(summary.draft || 0) + (summary.review || 0)} delta="Needs editing" tone={(summary.draft || 0) + (summary.review || 0) ? "neutral" : "up"} />
        <StatCard label="Ready / Published" value={(summary.ready || 0) + (summary.published || 0)} delta="Launch usable" tone="up" />
        <StatCard label="Blocked" value={summary.blocked || 0} delta="Must resolve" tone={summary.blocked ? "down" : "up"} />
      </div>

      <div className="asset-grid">
        <div className="asset-stack">
          <div className="asset-command">
            <Badge tone={tone(topAsset?.status || "draft")}>
              {topAsset ? titleCase(topAsset.status) : "No Asset"}
            </Badge>

            <div className="asset-score">{summary.readiness_score || 0}%</div>

            <h2 className="asset-title">
              {topAsset?.title || "Launch assets not loaded"}
            </h2>

            <div className="asset-sub">
              {topAsset?.notes || "Build the go-to-market materials needed for VoterSpheres launch."}
            </div>

            <div className="asset-actions" style={{ marginTop: 16 }}>
              <Link className="vs-button" to="/launch-readiness">Launch Readiness</Link>
              <Link className="vs-button vs-button-secondary" to="/pricing">Pricing</Link>
              <Link className="vs-button vs-button-secondary" to="/">Landing Page</Link>
            </div>
          </div>

          <SectionCard title={editingId ? "Edit Launch Asset" : "Create Launch Asset"} subtitle="Add or update launch materials.">
            <form className="asset-form" onSubmit={submitForm}>
              <input required placeholder="Title" value={form.title} onChange={(e) => updateForm("title", e.target.value)} />

              <div className="asset-form-grid">
                <input placeholder="Asset key" value={form.asset_key} onChange={(e) => updateForm("asset_key", e.target.value)} />
                <input placeholder="Category" value={form.category} onChange={(e) => updateForm("category", e.target.value)} />
                <select value={form.status} onChange={(e) => updateForm("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="ready">Ready</option>
                  <option value="published">Published</option>
                  <option value="blocked">Blocked</option>
                </select>
                <select value={form.priority} onChange={(e) => updateForm("priority", e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <input placeholder="Owner" value={form.owner} onChange={(e) => updateForm("owner", e.target.value)} />
                <input placeholder="Route, e.g. /pricing" value={form.route} onChange={(e) => updateForm("route", e.target.value)} />
                <input type="date" value={form.due_date} onChange={(e) => updateForm("due_date", e.target.value)} />
              </div>

              <textarea placeholder="Asset content / copy / checklist" value={form.content} onChange={(e) => updateForm("content", e.target.value)} />
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />

              <div className="asset-actions">
                <button className="vs-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Asset" : "Save Asset"}
                </button>
                {editingId ? (
                  <button className="vs-button vs-button-secondary" type="button" onClick={resetForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Filters" subtitle="Focus launch assets by category, status, or keyword.">
            <form className="asset-form" onSubmit={runSearch}>
              <input placeholder="Search launch assets..." value={filters.q} onChange={(e) => updateFilter("q", e.target.value)} />

              <div className="asset-form-grid">
                <select value={filters.category} onChange={(e) => updateFilter("category", e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="ready">Ready</option>
                  <option value="published">Published</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <button className="vs-button vs-button-secondary" type="submit">
                {loading ? "Filtering..." : "Apply Filters"}
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="asset-stack">
          {loading ? (
            <EmptyState text="Loading launch assets..." />
          ) : !assets.length ? (
            <EmptyState text="No launch assets found." />
          ) : (
            Object.entries(grouped).map(([category, rows]) => (
              <SectionCard
                key={category}
                title={category}
                subtitle={`Launch materials for ${category.toLowerCase()}.`}
                right={<Badge tone="accent">{rows.length}</Badge>}
              >
                <div className="asset-stack">
                  {rows.map((asset) => (
                    <div key={asset.id} className={`asset-row ${asset.status}`}>
                      <ResponsiveRow
                        title={asset.title}
                        subtitle={asset.content || asset.notes || "No content yet."}
                        meta={[
                          { label: "Status", value: titleCase(asset.status) },
                          { label: "Priority", value: titleCase(asset.priority) },
                          { label: "Owner", value: asset.owner || "N/A" },
                          { label: "Route", value: asset.route || "N/A" },
                          { label: "Due", value: asset.due_date ? String(asset.due_date).slice(0, 10) : "N/A" },
                        ]}
                        right={
                          <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                            <Badge tone={tone(asset.status)}>{titleCase(asset.status)}</Badge>
                            {asset.route ? <Link className="vs-button vs-button-secondary" to={asset.route}>Open</Link> : null}
                          </div>
                        }
                      />

                      <div className="asset-button-row" style={{ padding: "0 14px 14px" }}>
                        <button className="asset-mini-button" onClick={() => editAsset(asset)}>Edit</button>
                        {["draft", "review", "ready", "published", "blocked"].filter((status) => status !== asset.status).map((status) => (
                          <button
                            key={status}
                            className="asset-mini-button"
                            disabled={actionLoading === `status-${asset.id}`}
                            onClick={() => updateStatus(asset, status)}
                          >
                            {titleCase(status)}
                          </button>
                        ))}
                        <button
                          className="asset-mini-button"
                          disabled={actionLoading === `delete-${asset.id}`}
                          onClick={() => deleteAsset(asset)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
