import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

const DEFAULT_CHECKLIST = [
  { id: "client-setup", title: "Confirm client setup", description: "Verify firm name, primary contact, state focus, and onboarding goals.", category: "Client", priority: "High" },
  { id: "campaign-states", title: "Load priority states and campaigns", description: "Add battleground states, key races, candidate targets, and district priorities.", category: "Campaign", priority: "High" },
  { id: "reporting-template", title: "Create first executive report template", description: "Configure the workspace report layout, recipients, cadence, and delivery rules.", category: "Reports", priority: "High" },
  { id: "vendor-review", title: "Review vendor coverage", description: "Check field, mail, digital, polling, compliance, data, and fundraising vendor gaps.", category: "Vendors", priority: "Medium" },
  { id: "mailops-review", title: "Configure MailOps workflow", description: "Confirm mail drops, approvals, production dates, delivery windows, and risk alerts.", category: "MailOps", priority: "Medium" },
  { id: "command-center-signals", title: "Activate Command Center signals", description: "Review cross-signal priorities, alerts, intelligence feed, and rapid-response tasks.", category: "Command Center", priority: "High" },
];

function getStorageKey(workspaceId) {
  return `vs_workspace_onboarding_checklist_${workspaceId || "default"}`;
}

function loadStoredState(workspaceId) {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(getStorageKey(workspaceId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredState(workspaceId, state) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function priorityTone(priority) {
  const value = String(priority || "").toLowerCase();

  if (value === "high") return styles.priorityHigh;
  if (value === "medium") return styles.priorityMedium;

  return styles.priorityDefault;
}

function buildChecklistFromLocal(stored = {}) {
  return DEFAULT_CHECKLIST.map((item) => ({
    ...item,
    complete: Boolean(stored[item.id]?.complete),
    completedAt: stored[item.id]?.completedAt || null,
    syncSource: "local",
  }));
}

function normalizeRemoteChecklist(rows = []) {
  const byId = new Map(rows.map((item) => [String(item.id), item]));

  return DEFAULT_CHECKLIST.map((item) => {
    const remote = byId.get(item.id) || {};

    return {
      ...item,
      ...remote,
      id: item.id,
      title: remote.title || item.title,
      description: remote.description || item.description,
      category: remote.category || item.category,
      priority: remote.priority || item.priority,
      complete: Boolean(remote.complete),
      completedAt: remote.completedAt || remote.completed_at || null,
      syncSource: "server",
    };
  });
}

function checklistToStoredState(checklist = []) {
  return checklist.reduce((acc, item) => {
    acc[item.id] = {
      complete: Boolean(item.complete),
      completedAt: item.completedAt || null,
    };

    return acc;
  }, {});
}

export default function WorkspaceOnboardingChecklist({
  workspaceId,
  workspaceName = "Workspace",
}) {
  const [storedState, setStoredState] = useState(() => loadStoredState(workspaceId));
  const [remoteChecklist, setRemoteChecklist] = useState(null);
  const [syncError, setSyncError] = useState("");
  const [syncingItemId, setSyncingItemId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStoredState(loadStoredState(workspaceId));
    setRemoteChecklist(null);
    setSyncError("");

    let active = true;

    async function loadRemoteChecklist() {
      if (!workspaceId || !api.workspaceOnboardingChecklist) return;

      try {
        setLoading(true);
        const response = await api.workspaceOnboardingChecklist(workspaceId);
        const checklist = normalizeRemoteChecklist(response?.checklist || []);

        if (!active) return;

        setRemoteChecklist(checklist);
        const nextStoredState = checklistToStoredState(checklist);
        setStoredState(nextStoredState);
        saveStoredState(workspaceId, nextStoredState);
      } catch (error) {
        if (!active) return;

        setSyncError(
          error?.response?.data?.error ||
            error?.message ||
            "Checklist is using local fallback sync."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRemoteChecklist();

    return () => {
      active = false;
    };
  }, [workspaceId]);

  const checklist = useMemo(() => {
    if (remoteChecklist) return remoteChecklist;
    return buildChecklistFromLocal(storedState);
  }, [remoteChecklist, storedState]);

  const completedCount = checklist.filter((item) => item.complete).length;
  const completionRate = checklist.length
    ? Math.round((completedCount / checklist.length) * 100)
    : 0;

  async function updateItem(itemId, complete) {
    const optimisticChecklist = checklist.map((item) =>
      item.id === itemId
        ? {
            ...item,
            complete,
            completedAt: complete ? new Date().toISOString() : null,
          }
        : item
    );

    const nextStoredState = checklistToStoredState(optimisticChecklist);

    setStoredState(nextStoredState);
    setRemoteChecklist(optimisticChecklist);
    saveStoredState(workspaceId, nextStoredState);

    if (!workspaceId || !api.updateWorkspaceOnboardingChecklistItem) return;

    try {
      setSyncingItemId(itemId);
      setSyncError("");

      const response = await api.updateWorkspaceOnboardingChecklistItem(
        workspaceId,
        itemId,
        { complete }
      );

      const serverChecklist = normalizeRemoteChecklist(response?.checklist || optimisticChecklist);

      setRemoteChecklist(serverChecklist);

      const syncedStoredState = checklistToStoredState(serverChecklist);
      setStoredState(syncedStoredState);
      saveStoredState(workspaceId, syncedStoredState);
    } catch (error) {
      setSyncError(
        error?.response?.data?.error ||
          error?.message ||
          "Checklist saved locally. Server sync failed."
      );
    } finally {
      setSyncingItemId("");
    }
  }

  async function resetChecklist() {
    setRemoteChecklist(buildChecklistFromLocal({}));
    setStoredState({});
    saveStoredState(workspaceId, {});

    if (!workspaceId || !api.resetWorkspaceOnboardingChecklist) return;

    try {
      setLoading(true);
      setSyncError("");

      const response = await api.resetWorkspaceOnboardingChecklist(workspaceId);
      const serverChecklist = normalizeRemoteChecklist(response?.checklist || []);

      setRemoteChecklist(serverChecklist);
    } catch (error) {
      setSyncError(
        error?.response?.data?.error ||
          error?.message ||
          "Checklist reset locally. Server reset failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const syncLabel = syncError
    ? "Local fallback"
    : remoteChecklist
      ? "Synced"
      : "Local";

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Workspace Launch</div>
          <h2 style={styles.title}>Onboarding Checklist</h2>
          <p style={styles.subtitle}>
            Track the setup steps needed to make {workspaceName} operational.
          </p>
        </div>

        <div style={styles.progressWrap}>
          <div style={styles.progressNumber}>{completionRate}%</div>
          <div style={styles.progressLabel}>
            {completedCount} of {checklist.length} complete
          </div>
          <div style={styles.syncLabel}>{loading ? "Syncing..." : syncLabel}</div>
        </div>
      </div>

      {syncError ? <div style={styles.syncWarning}>{syncError}</div> : null}

      <div style={styles.progressBarOuter}>
        <div style={{ ...styles.progressBarInner, width: `${completionRate}%` }} />
      </div>

      <div style={styles.list}>
        {checklist.map((item) => (
          <label
            key={item.id}
            style={{ ...styles.item, ...(item.complete ? styles.itemComplete : null) }}
          >
            <input
              type="checkbox"
              checked={item.complete}
              disabled={syncingItemId === item.id}
              onChange={(event) => updateItem(item.id, event.target.checked)}
              style={styles.checkbox}
            />

            <div style={styles.itemBody}>
              <div style={styles.itemTopRow}>
                <div style={styles.itemTitle}>
                  {item.title}
                  {syncingItemId === item.id ? <span style={styles.inlineSync}> syncing</span> : null}
                </div>

                <div style={styles.badgeRow}>
                  <span style={styles.categoryBadge}>{item.category}</span>
                  <span style={{ ...styles.priorityBadge, ...priorityTone(item.priority) }}>
                    {item.priority}
                  </span>
                </div>
              </div>

              <div style={styles.itemDescription}>{item.description}</div>

              {item.complete && item.completedAt ? (
                <div style={styles.completedText}>
                  Completed {new Date(item.completedAt).toLocaleDateString()}
                </div>
              ) : null}
            </div>
          </label>
        ))}
      </div>

      <div style={styles.footer}>
        <button type="button" style={styles.secondaryButton} onClick={resetChecklist}>
          Reset checklist
        </button>

        <div style={styles.footerNote}>
          {remoteChecklist
            ? "Saved to workspace sync and local fallback."
            : "Stored locally until backend sync is available."}
        </div>
      </div>
    </section>
  );
}

const styles = {
  card: {
    background: "var(--vs-card, #0f172a)",
    border: "1px solid var(--vs-border, rgba(148, 163, 184, 0.25))",
    borderRadius: "18px",
    padding: "20px",
    color: "var(--vs-text, #f8fafc)",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.18)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  eyebrow: {
    color: "var(--vs-accent, #60a5fa)",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    lineHeight: 1.2,
    fontWeight: 900,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "var(--vs-text-muted, #94a3b8)",
    lineHeight: 1.5,
    maxWidth: "680px",
  },
  progressWrap: {
    minWidth: "150px",
    textAlign: "right",
  },
  progressNumber: {
    fontSize: "30px",
    lineHeight: 1,
    fontWeight: 900,
  },
  progressLabel: {
    marginTop: "6px",
    color: "var(--vs-text-muted, #94a3b8)",
    fontSize: "13px",
  },
  syncLabel: {
    marginTop: "6px",
    display: "inline-block",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 800,
    color: "#bfdbfe",
    background: "rgba(37, 99, 235, 0.18)",
    border: "1px solid rgba(96, 165, 250, 0.28)",
  },
  syncWarning: {
    marginTop: "14px",
    borderRadius: "12px",
    padding: "10px 12px",
    color: "#fde68a",
    background: "rgba(217, 119, 6, 0.12)",
    border: "1px solid rgba(251, 191, 36, 0.2)",
    fontSize: "13px",
    fontWeight: 700,
  },
  progressBarOuter: {
    marginTop: "18px",
    height: "10px",
    borderRadius: "999px",
    overflow: "hidden",
    background: "rgba(148, 163, 184, 0.18)",
  },
  progressBarInner: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #2563eb, #22c55e)",
    transition: "width 200ms ease",
  },
  list: {
    display: "grid",
    gap: "12px",
    marginTop: "18px",
  },
  item: {
    display: "flex",
    gap: "12px",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    background: "rgba(15, 23, 42, 0.34)",
    cursor: "pointer",
  },
  itemComplete: {
    opacity: 0.82,
    background: "rgba(34, 197, 94, 0.08)",
    borderColor: "rgba(34, 197, 94, 0.34)",
  },
  checkbox: {
    marginTop: "4px",
    width: "18px",
    height: "18px",
    accentColor: "#2563eb",
    cursor: "pointer",
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  itemTitle: {
    fontWeight: 850,
    fontSize: "15px",
  },
  inlineSync: {
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 700,
  },
  badgeRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  categoryBadge: {
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: 750,
    color: "#bfdbfe",
    background: "rgba(37, 99, 235, 0.18)",
    border: "1px solid rgba(96, 165, 250, 0.28)",
  },
  priorityBadge: {
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: 800,
    border: "1px solid transparent",
  },
  priorityHigh: {
    color: "#fecaca",
    background: "rgba(220, 38, 38, 0.16)",
    borderColor: "rgba(248, 113, 113, 0.25)",
  },
  priorityMedium: {
    color: "#fde68a",
    background: "rgba(217, 119, 6, 0.16)",
    borderColor: "rgba(251, 191, 36, 0.25)",
  },
  priorityDefault: {
    color: "#cbd5e1",
    background: "rgba(148, 163, 184, 0.14)",
    borderColor: "rgba(148, 163, 184, 0.22)",
  },
  itemDescription: {
    marginTop: "8px",
    color: "var(--vs-text-muted, #94a3b8)",
    lineHeight: 1.45,
    fontSize: "13px",
  },
  completedText: {
    marginTop: "8px",
    color: "#86efac",
    fontSize: "12px",
    fontWeight: 700,
  },
  footer: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  secondaryButton: {
    border: "1px solid rgba(148, 163, 184, 0.28)",
    background: "rgba(15, 23, 42, 0.28)",
    color: "var(--vs-text, #f8fafc)",
    borderRadius: "10px",
    padding: "10px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  footerNote: {
    color: "var(--vs-text-muted, #94a3b8)",
    fontSize: "12px",
  },
};

