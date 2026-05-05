import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import SectionCard from "../ui/SectionCard";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import ResponsiveRow from "../ui/ResponsiveRow";

const DAYS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 }
];

const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  label: `${hour.toString().padStart(2, "0")}:00`,
  value: hour
}));

const emptyForm = {
  name: "",
  recipients: "",
  frequency: "weekly",
  day_of_week: 1,
  hour: 9,
  timezone: "America/Chicago",
  enabled: true
};

const fieldStyle = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background: "rgba(15, 23, 42, 0.45)",
  color: "inherit",
  padding: "0.75rem 0.85rem",
  outline: "none"
};

function toneForSchedule(schedule = {}) {
  if (!schedule.enabled) return "default";
  if (schedule.last_sent_at) return "active";
  return "demo";
}

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString();
}

function normalizeSchedules(data = {}) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.schedules)) return data.schedules;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function normalizeRecipientString(value = "") {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "");
}

export default function ScheduledReportsPanel({
  workspaceId,
  workspaceName = "Workspace",
  defaultRecipient = "",
  onRecipientChange
}) {
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [runningId, setRunningId] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    name: `${workspaceName || "Workspace"} Weekly Report`,
    recipients: defaultRecipient || ""
  }));

  const enabledCount = useMemo(
    () => schedules.filter((schedule) => schedule.enabled).length,
    [schedules]
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name:
        prev.name && prev.name !== "Workspace Weekly Report"
          ? prev.name
          : `${workspaceName || "Workspace"} Weekly Report`,
      recipients: prev.recipients || defaultRecipient || ""
    }));
  }, [workspaceName, defaultRecipient]);

  useEffect(() => {
    let active = true;

    async function loadSchedules() {
      if (!workspaceId) {
        setSchedules([]);
        return;
      }

      try {
        setLoadingSchedules(true);
        setScheduleError("");

        const data = await api.workspaceReportSchedules(workspaceId);
        const rows = normalizeSchedules(data);

        if (!active) return;
        setSchedules(rows);
      } catch (error) {
        if (!active) return;
        setSchedules([]);
        setScheduleError(
          error?.response?.data?.error ||
            error?.message ||
            "Failed to load scheduled reports."
        );
      } finally {
        if (active) setLoadingSchedules(false);
      }
    }

    loadSchedules();

    return () => {
      active = false;
    };
  }, [workspaceId]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setEditingId("");
    setForm({
      ...emptyForm,
      name: `${workspaceName || "Workspace"} Weekly Report`,
      recipients: defaultRecipient || ""
    });
  }

  function editSchedule(schedule) {
    setEditingId(String(schedule.id));
    setForm({
      name: schedule.name || `${workspaceName || "Workspace"} Scheduled Report`,
      recipients: normalizeRecipientString(schedule.recipients),
      frequency: schedule.frequency || "weekly",
      day_of_week: Number(schedule.day_of_week ?? 1),
      hour: Number(schedule.hour ?? 9),
      timezone: schedule.timezone || "America/Chicago",
      enabled: Boolean(schedule.enabled)
    });
  }

  async function saveSchedule(event) {
    event.preventDefault();

    if (!workspaceId) {
      setScheduleError("No active workspace selected.");
      return;
    }

    if (!form.recipients.trim()) {
      setScheduleError("At least one recipient email is required.");
      return;
    }

    const payload = {
      name: form.name.trim() || `${workspaceName || "Workspace"} Scheduled Report`,
      recipients: form.recipients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      frequency: form.frequency || "weekly",
      day_of_week: Number(form.day_of_week ?? 1),
      hour: Number(form.hour ?? 9),
      timezone: form.timezone || "America/Chicago",
      enabled: Boolean(form.enabled)
    };

    try {
      setSavingSchedule(true);
      setScheduleError("");
      setScheduleMessage("");

      const response = editingId
        ? await api.updateWorkspaceReportSchedule(editingId, payload)
        : await api.createWorkspaceReportSchedule(workspaceId, payload);

      const saved = response?.schedule || response;

      setSchedules((prev) => {
        if (editingId) {
          return prev.map((item) =>
            String(item.id) === String(editingId) ? saved : item
          );
        }

        return [saved, ...prev];
      });

      if (payload.recipients[0]) {
        onRecipientChange?.(payload.recipients[0]);
      }

      setScheduleMessage(editingId ? "Schedule updated." : "Schedule created.");
      resetForm();
    } catch (error) {
      setScheduleError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to save scheduled report."
      );
    } finally {
      setSavingSchedule(false);
    }
  }

  async function runNow(schedule) {
    try {
      setRunningId(String(schedule.id));
      setScheduleError("");
      setScheduleMessage("");

      await api.runWorkspaceReportSchedule(schedule.id);

      setScheduleMessage(`Scheduled report sent for ${schedule.name}.`);

      const data = await api.workspaceReportSchedules(workspaceId);
      setSchedules(normalizeSchedules(data));
    } catch (error) {
      setScheduleError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to run scheduled report."
      );
    } finally {
      setRunningId("");
    }
  }

  async function toggleSchedule(schedule) {
    try {
      setScheduleError("");
      setScheduleMessage("");

      const response = await api.updateWorkspaceReportSchedule(schedule.id, {
        name: schedule.name,
        recipients: schedule.recipients || [],
        frequency: schedule.frequency || "weekly",
        day_of_week: Number(schedule.day_of_week ?? 1),
        hour: Number(schedule.hour ?? 9),
        timezone: schedule.timezone || "America/Chicago",
        enabled: !schedule.enabled
      });

      const saved = response?.schedule || response;

      setSchedules((prev) =>
        prev.map((item) => (String(item.id) === String(schedule.id) ? saved : item))
      );

      setScheduleMessage(saved.enabled ? "Schedule enabled." : "Schedule disabled.");
    } catch (error) {
      setScheduleError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to update schedule."
      );
    }
  }

  async function deleteSchedule(schedule) {
    try {
      setScheduleError("");
      setScheduleMessage("");

      await api.deleteWorkspaceReportSchedule(schedule.id);

      setSchedules((prev) =>
        prev.filter((item) => String(item.id) !== String(schedule.id))
      );

      if (String(editingId) === String(schedule.id)) resetForm();

      setScheduleMessage("Schedule deleted.");
    } catch (error) {
      setScheduleError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to delete schedule."
      );
    }
  }

  return (
    <SectionCard
      title="Scheduled Reports"
      subtitle="Automatically send workspace reports to clients on a daily or weekly cadence."
      right={
        <div className="vs-inline-actions">
          <Badge tone={enabledCount ? "active" : "demo"}>
            {enabledCount} active
          </Badge>
        </div>
      }
    >
      <div className="vs-stack">
        {scheduleError ? (
          <div
            className="vs-banner"
            style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
          >
            {scheduleError}
          </div>
        ) : null}

        {scheduleMessage ? (
          <div
            className="vs-banner"
            style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534" }}
          >
            {scheduleMessage}
          </div>
        ) : null}

        <div className="vs-card-muted">
          <form onSubmit={saveSchedule} style={{ display: "grid", gap: "0.85rem" }}>
            <div className="vs-grid-2">
              <label style={{ display: "grid", gap: "0.4rem" }}>
                <span className="vs-stat-label">Schedule Name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Weekly Client Report"
                  style={fieldStyle}
                />
              </label>

              <label style={{ display: "grid", gap: "0.4rem" }}>
                <span className="vs-stat-label">Recipients</span>
                <input
                  value={form.recipients}
                  onChange={(event) => updateForm("recipients", event.target.value)}
                  placeholder="client@example.com, team@example.com"
                  style={fieldStyle}
                />
              </label>
            </div>

            <div className="vs-grid-4">
              <label style={{ display: "grid", gap: "0.4rem" }}>
                <span className="vs-stat-label">Frequency</span>
                <select
                  value={form.frequency}
                  onChange={(event) => updateForm("frequency", event.target.value)}
                  style={fieldStyle}
                >
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: "0.4rem" }}>
                <span className="vs-stat-label">Day</span>
                <select
                  value={form.day_of_week}
                  onChange={(event) => updateForm("day_of_week", event.target.value)}
                  disabled={form.frequency === "daily"}
                  style={fieldStyle}
                >
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: "0.4rem" }}>
                <span className="vs-stat-label">Hour</span>
                <select
                  value={form.hour}
                  onChange={(event) => updateForm("hour", event.target.value)}
                  style={fieldStyle}
                >
                  {HOURS.map((hour) => (
                    <option key={hour.value} value={hour.value}>
                      {hour.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: "0.4rem" }}>
                <span className="vs-stat-label">Timezone</span>
                <input
                  value={form.timezone}
                  onChange={(event) => updateForm("timezone", event.target.value)}
                  placeholder="America/Chicago"
                  style={fieldStyle}
                />
              </label>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "rgba(148, 163, 184, 0.95)",
                fontSize: "0.9rem"
              }}
            >
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => updateForm("enabled", event.target.checked)}
              />
              Enable this schedule
            </label>

            <div className="vs-inline-actions">
              <button type="submit" className="vs-button" disabled={savingSchedule}>
                {savingSchedule
                  ? "Saving..."
                  : editingId
                    ? "Save Schedule"
                    : "Create Schedule"}
              </button>

              {editingId ? (
                <button
                  type="button"
                  className="vs-button vs-button-secondary"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </div>

        {loadingSchedules ? (
          <EmptyState text="Loading scheduled reports..." />
        ) : !schedules.length ? (
          <EmptyState text="No scheduled reports yet. Create one above to start automated client reporting." />
        ) : (
          schedules.map((schedule) => (
            <ResponsiveRow
              key={schedule.id}
              title={schedule.name}
              subtitle={`${schedule.frequency || "weekly"} â€¢ next run ${formatDateTime(schedule.next_run_at)}`}
              meta={[
                { label: "Recipients", value: normalizeRecipientString(schedule.recipients) || "â€”" },
                { label: "Last Sent", value: formatDateTime(schedule.last_sent_at) },
                { label: "Status", value: schedule.enabled ? "Enabled" : "Disabled" }
              ]}
              right={
                <div className="vs-inline-actions">
                  <Badge tone={toneForSchedule(schedule)}>
                    {schedule.enabled ? "Enabled" : "Paused"}
                  </Badge>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => runNow(schedule)}
                    disabled={runningId === String(schedule.id)}
                  >
                    {runningId === String(schedule.id) ? "Sending..." : "Run Now"}
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => editSchedule(schedule)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => toggleSchedule(schedule)}
                  >
                    {schedule.enabled ? "Pause" : "Enable"}
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => deleteSchedule(schedule)}
                  >
                    Delete
                  </button>
                </div>
              }
            />
          ))
        )}
      </div>
    </SectionCard>
  );
}
