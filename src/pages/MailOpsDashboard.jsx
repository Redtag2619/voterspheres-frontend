import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import DemoBanner from "../components/ui/DemoBanner";
import { useDemoMode } from "../context/DemoModeContext.jsx";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";
import useRealtimeStream from "../hooks/useRealtimeStream";

const USPS_POLITICAL_MAIL_ALERT_URL =
  "https://tools.usps.com/political-mail-alert.htm";

const USPS_POLITICAL_MAIL_ISSUE_URL =
  "https://tools.usps.com/political-mail-issue.htm";

const USPS_INFORMED_DELIVERY_CAMPAIGN_URL =
  "https://id.usps.com/rminMailerPortal/pages/secure/dashboard.action";

const STATE_OPTIONS = [
  ["", "Select State"],
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["IA", "Iowa"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["MA", "Massachusetts"],
  ["MD", "Maryland"],
  ["ME", "Maine"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MO", "Missouri"],
  ["MS", "Mississippi"],
  ["MT", "Montana"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["NE", "Nebraska"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NV", "Nevada"],
  ["NY", "New York"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VA", "Virginia"],
  ["VT", "Vermont"],
  ["WA", "Washington"],
  ["WI", "Wisconsin"],
  ["WV", "West Virginia"],
  ["WY", "Wyoming"],
  ["DC", "District of Columbia"],
];

function toneForStatus(value) {
  const v = String(value || "").toLowerCase();

  if (["elevated", "delayed", "issue opened"].includes(v)) {
    return "danger";
  }

  if (
    ["on track", "delivered", "resolved", "arrived scf"].includes(v)
  ) {
    return "active";
  }

  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();

  if (["high", "critical"].includes(v)) {
    return "danger";
  }

  if (v === "medium") {
    return "demo";
  }

  return "default";
}

function formatDate(value) {
  if (!value) return "TBD";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "TBD"
    : date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "TBD";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "TBD"
    : date.toLocaleString();
}

function number(value, fallback = 0) {
  const next = Number(value);

  return Number.isFinite(next)
    ? next
    : fallback;
}

function pct(numerator, denominator) {
  const total = number(denominator);

  if (!total) return "0%";

  return `${Math.round(
    (number(numerator) / total) * 100
  )}%`;
}

function getRisk(row = {}) {
  return row.delivery_risk || row.risk || "Monitor";
}

function fileNameFromInput(fileInput) {
  const file = fileInput?.target?.files?.[0];
  return file?.name || "";
}

function Field({ label, value }) {
  return (
    <div>
      <div className="vs-stat-label">{label}</div>

      <div
        style={{
          marginTop: 4,
          fontWeight: 800,
          color: "var(--vs-text)",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

const emptyComposer = {
  campaign: "",

  office: "",
  location: "",
  state: "",

  print_vendor: "",
  assigned_to: "",

  status: "Pending",
  severity: "Medium",

  job_number: "",

  mail_class: "Marketing Mail",
  mail_format: "Letter",

  quantity: "",
  pieces_mailed: "",

  permit_number: "",
  crid: "",
  imb_mid: "",
  imb_serial_range: "",

  scf: "",
  scf_address: "",

  ndc: "",
  ndc_address: "",

  expected_scf_arrival_date: "",
  actual_scf_arrival_date: "",

  estimated_in_home_date: "",
  actual_in_home_date: "",

  political_mail_alert_confirmation: "",
  political_mail_issue_confirmation: "",

  informed_delivery_campaign_name: "",
  informed_delivery_campaign_id: "",

  note: "",
};

export default function MailOpsDashboard() {
  const { demoMode } = useDemoMode();

  const { filters } =
    useExecutiveFilters();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [dashboard, setDashboard] =
    useState({
      metrics: [],
      drops: [],
      alerts: [],
    });

  const [events, setEvents] =
    useState([]);

  const [composer, setComposer] =
    useState({
      ...emptyComposer,
      state: filters.state || "",
    });

  const [mailOpsOptions, setMailOpsOptions] =
    useState({
      assigned_to: [],
      print_vendors: [],
      permit_numbers: [],
      crids: [],
      mids: [],
      organizations: [],
      organization_addresses: [],
      scfs: [],
      ndcs: [],
    });

  useRealtimeStream(
    "intelligence:mailops",
    () => {
      loadDashboard();
      loadEvents();
    }
  );

  async function loadDashboard() {
    try {
      const response =
        await api.mailOpsDashboard();

      setDashboard(response || {});
    } catch (err) {
      console.error(err);
    }
  }

  async function loadEvents() {
    try {
      const response =
        await api.mailOpsEvents();

      setEvents(response?.results || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadOptions() {
    try {
      const response =
        await api.mailOpsOptions();

      setMailOpsOptions(
        response || {}
      );
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        await Promise.all([
          loadDashboard(),
          loadEvents(),
          loadOptions(),
        ]);
      } catch (err) {
        console.error(err);

        setError(
          "Failed to load MailOps dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function updateComposer(patch) {
    setComposer((prev) => ({
      ...prev,
      ...patch,
    }));
  }

  function handleScfSelect(value) {
    const found =
      (mailOpsOptions.scfs || []).find(
        (item) => item.name === value
      );

    updateComposer({
      scf: value,
      scf_address:
        found?.address || "",
    });
  }

  function handleNdcSelect(value) {
    const found =
      (mailOpsOptions.ndcs || []).find(
        (item) => item.name === value
      );

    updateComposer({
      ndc: value,
      ndc_address:
        found?.address || "",
    });
  }

  async function handleCreateEvent(
    e
  ) {
    e.preventDefault();

    try {
      setSaving(true);

      await api.createMailOpsEvent({
        ...composer,
      });

      setSuccessMessage(
        "MailOps job created successfully."
      );

      setComposer({
        ...emptyComposer,
      });

      await Promise.all([
        loadDashboard(),
        loadEvents(),
        loadOptions(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to create job"
      );
    } finally {
      setSaving(false);
    }
  }

  const elevatedDrops =
    dashboard?.drops?.filter(
      (row) =>
        ["elevated", "high"].includes(
          String(
            getRisk(row)
          ).toLowerCase()
        )
    ).length || 0;

  const totalPieces = useMemo(() => {
    return events.reduce(
      (sum, row) =>
        sum +
        number(
          row.quantity ||
            row.pieces_mailed
        ),
      0
    );
  }, [events]);

  return (
    <PageShell
      eyebrow="MailOps Intelligence"
      title="Political Mail Operations Terminal"
      description="USPS intelligence, SCF tracking, NDC visibility, permit management, Informed Delivery campaign tracking, and political mail escalation."
      demo={demoMode}
      tickerItems={[
        {
          label: "Jobs",
          value: `${events.length}`,
          dotClass:
            "vs-live-dot-success",
        },
        {
          label: "Pieces",
          value:
            totalPieces.toLocaleString(),
          dotClass:
            "vs-live-dot-success",
        },
        {
          label: "Elevated",
          value: `${elevatedDrops}`,
          dotClass:
            elevatedDrops
              ? "vs-live-dot"
              : "vs-live-dot-success",
        },
      ]}
    >
      <DemoBanner
        active={false}
        text="Live MailOps intelligence enabled."
      />

      {error ? (
        <div className="vs-banner vs-banner-danger">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="vs-banner">
          {successMessage}
        </div>
      ) : null}

      <div className="vs-grid-4">
        {(dashboard?.metrics || []).map(
          (metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone}
            />
          )
        )}
      </div>

      <SectionCard
        title="USPS Political Mail Actions"
        subtitle="Direct USPS escalation and Informed Delivery campaign actions."
      >
        <div
          className="vs-inline-actions"
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <a
            className="vs-button"
            href={
              USPS_POLITICAL_MAIL_ALERT_URL
            }
            target="_blank"
            rel="noreferrer"
          >
            USPS Political Mail Alert
          </a>

          <a
            className="vs-button vs-button-secondary"
            href={
              USPS_POLITICAL_MAIL_ISSUE_URL
            }
            target="_blank"
            rel="noreferrer"
          >
            USPS Political Mail Issue
          </a>

          <a
            className="vs-button vs-button-secondary"
            href={
              USPS_INFORMED_DELIVERY_CAMPAIGN_URL
            }
            target="_blank"
            rel="noreferrer"
          >
            Informed Delivery Portal
          </a>
        </div>
      </SectionCard>

      <SectionCard
        title="Mail Job Composer"
        subtitle="Create and track political mail operations."
      >
        <form
          onSubmit={
            handleCreateEvent
          }
          className="vs-stack"
        >
          <div className="vs-grid-4">
            <input
              className="vs-input"
              placeholder="Organization"
              list="mailops-organizations"
              value={composer.office}
              onChange={(e) =>
                updateComposer({
                  office:
                    e.target.value,
                })
              }
              required
            />

            <input
              className="vs-input"
              placeholder="Organization Address"
              list="mailops-organization-addresses"
              value={composer.location}
              onChange={(e) =>
                updateComposer({
                  location:
                    e.target.value,
                })
              }
              required
            />

            <select
              className="vs-select"
              value={composer.state}
              onChange={(e) =>
                updateComposer({
                  state:
                    e.target.value,
                })
              }
              required
            >
              {STATE_OPTIONS.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <input
              className="vs-input"
              placeholder="Print Vendor"
              list="mailops-print-vendors"
              value={
                composer.print_vendor
              }
              onChange={(e) =>
                updateComposer({
                  print_vendor:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="vs-grid-4">
            <input
              className="vs-input"
              placeholder="Assigned To"
              list="mailops-assigned-to"
              value={
                composer.assigned_to
              }
              onChange={(e) =>
                updateComposer({
                  assigned_to:
                    e.target.value,
                })
              }
            />

            <input
              className="vs-input"
              placeholder="Job Number"
              value={
                composer.job_number
              }
              onChange={(e) =>
                updateComposer({
                  job_number:
                    e.target.value,
                })
              }
            />

            <select
              className="vs-select"
              value={
                composer.mail_class
              }
              onChange={(e) =>
                updateComposer({
                  mail_class:
                    e.target.value,
                })
              }
            >
              <option value="Marketing Mail">
                Marketing Mail
              </option>

              <option value="First-Class Mail">
                First-Class Mail
              </option>
            </select>

            <select
              className="vs-select"
              value={
                composer.mail_format
              }
              onChange={(e) =>
                updateComposer({
                  mail_format:
                    e.target.value,
                })
              }
            >
              <option value="Letter">
                Letter
              </option>

              <option value="Flat">
                Flat
              </option>
            </select>
          </div>

          <div className="vs-grid-4">
            <input
              className="vs-input"
              placeholder="SCF"
              list="mailops-scf-list"
              value={composer.scf}
              onChange={(e) =>
                handleScfSelect(
                  e.target.value
                )
              }
            />

            <input
              className="vs-input"
              placeholder="SCF Address"
              list="mailops-scf-addresses"
              value={
                composer.scf_address
              }
              onChange={(e) =>
                updateComposer({
                  scf_address:
                    e.target.value,
                })
              }
            />

            <input
              className="vs-input"
              placeholder="NDC"
              list="mailops-ndc-list"
              value={composer.ndc}
              onChange={(e) =>
                handleNdcSelect(
                  e.target.value
                )
              }
            />

            <input
              className="vs-input"
              placeholder="NDC Address"
              list="mailops-ndc-addresses"
              value={
                composer.ndc_address
              }
              onChange={(e) =>
                updateComposer({
                  ndc_address:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="vs-grid-4">
            <input
              className="vs-input"
              placeholder="Permit Number"
              list="mailops-permit-numbers"
              value={
                composer.permit_number
              }
              onChange={(e) =>
                updateComposer({
                  permit_number:
                    e.target.value,
                })
              }
            />

            <input
              className="vs-input"
              placeholder="CRID"
              list="mailops-crids"
              value={composer.crid}
              onChange={(e) =>
                updateComposer({
                  crid:
                    e.target.value,
                })
              }
            />

            <input
              className="vs-input"
              placeholder="MID"
              list="mailops-mids"
              value={
                composer.imb_mid
              }
              onChange={(e) =>
                updateComposer({
                  imb_mid:
                    e.target.value,
                })
              }
            />

            <input
              className="vs-input"
              placeholder="IMb Serial Range"
              value={
                composer.imb_serial_range
              }
              onChange={(e) =>
                updateComposer({
                  imb_serial_range:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="vs-grid-4">
            <input
              className="vs-input"
              placeholder="Political Alert Confirmation #"
              value={
                composer.political_mail_alert_confirmation
              }
              onChange={(e) =>
                updateComposer({
                  political_mail_alert_confirmation:
                    e.target.value,
                })
              }
            />

            <input
              className="vs-input"
              placeholder="Political Issue Confirmation #"
              value={
                composer.political_mail_issue_confirmation
              }
              onChange={(e) =>
                updateComposer({
                  political_mail_issue_confirmation:
                    e.target.value,
                })
              }
            />

            <input
              className="vs-input"
              placeholder="Informed Delivery Campaign Name"
              value={
                composer.informed_delivery_campaign_name
              }
              onChange={(e) =>
                updateComposer({
                  informed_delivery_campaign_name:
                    e.target.value,
                })
              }
            />

            <input
              className="vs-input"
              placeholder="Informed Delivery Campaign ID"
              value={
                composer.informed_delivery_campaign_id
              }
              onChange={(e) =>
                updateComposer({
                  informed_delivery_campaign_id:
                    e.target.value,
                })
              }
            />
          </div>

          <textarea
            className="vs-textarea"
            rows={4}
            placeholder="Operational Notes"
            value={composer.note}
            onChange={(e) =>
              updateComposer({
                note:
                  e.target.value,
              })
            }
          />

          <div
            className="vs-inline-actions"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="submit"
              className="vs-button vs-button-primary"
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Create Mail Job"}
            </button>
          </div>
        </form>

        <datalist id="mailops-assigned-to">
          {(mailOpsOptions.assigned_to ||
            []).map((value) => (
            <option
              key={value}
              value={value}
            />
          ))}
        </datalist>

        <datalist id="mailops-print-vendors">
          {(mailOpsOptions.print_vendors ||
            []).map((value) => (
            <option
              key={value}
              value={value}
            />
          ))}
        </datalist>

        <datalist id="mailops-permit-numbers">
          {(mailOpsOptions.permit_numbers ||
            []).map((value) => (
            <option
              key={value}
              value={value}
            />
          ))}
        </datalist>

        <datalist id="mailops-crids">
          {(mailOpsOptions.crids ||
            []).map((value) => (
            <option
              key={value}
              value={value}
            />
          ))}
        </datalist>

        <datalist id="mailops-mids">
          {(mailOpsOptions.mids ||
            []).map((value) => (
            <option
              key={value}
              value={value}
            />
          ))}
        </datalist>

        <datalist id="mailops-organizations">
          {(mailOpsOptions.organizations ||
            []).map((value) => (
            <option
              key={value}
              value={value}
            />
          ))}
        </datalist>

        <datalist id="mailops-organization-addresses">
          {(mailOpsOptions.organization_addresses ||
            []).map((value) => (
            <option
              key={value}
              value={value}
            />
          ))}
        </datalist>

        <datalist id="mailops-scf-list">
          {(mailOpsOptions.scfs ||
            []).map((item) => (
            <option
              key={`${item.name}-${item.address}`}
              value={item.name}
            >
              {item.address}
            </option>
          ))}
        </datalist>

        <datalist id="mailops-scf-addresses">
          {(mailOpsOptions.scfs ||
            []).map((item) => (
            <option
              key={`${item.address}-${item.name}`}
              value={item.address}
            >
              {item.name}
            </option>
          ))}
        </datalist>

        <datalist id="mailops-ndc-list">
          {(mailOpsOptions.ndcs ||
            []).map((item) => (
            <option
              key={`${item.name}-${item.address}`}
              value={item.name}
            >
              {item.address}
            </option>
          ))}
        </datalist>

        <datalist id="mailops-ndc-addresses">
          {(mailOpsOptions.ndcs ||
            []).map((item) => (
            <option
              key={`${item.address}-${item.name}`}
              value={item.address}
            >
              {item.name}
            </option>
          ))}
        </datalist>
      </SectionCard>

      <SectionCard
        title="MailOps Job Queue"
        subtitle="Track live mail movement and operational status."
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading MailOps jobs..." />
          ) : !events.length ? (
            <EmptyState text="No MailOps jobs available." />
          ) : (
            events.map((row) => (
              <ResponsiveRow
                key={row.id}
                title={
                  row.campaign ||
                  row.job_number
                }
                subtitle={`${row.office || "Organization"} • ${
                  row.state || "State"
                }`}
                meta={[
                  {
                    label: "Assigned",
                    value:
                      row.assigned_to,
                  },
                  {
                    label:
                      "Print Vendor",
                    value:
                      row.print_vendor,
                  },
                  {
                    label: "SCF",
                    value: row.scf,
                  },
                  {
                    label: "NDC",
                    value: row.ndc,
                  },
                  {
                    label:
                      "Last Scan",
                    value:
                      formatDateTime(
                        row.usps_last_scan_date
                      ),
                  },
                ]}
                right={
                  <div
                    style={{
                      display:
                        "flex",
                      gap: 8,
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <Badge
                      tone={toneForStatus(
                        row.status
                      )}
                    >
                      {row.status}
                    </Badge>

                    <Badge
                      tone={toneForSeverity(
                        row.severity
                      )}
                    >
                      {row.severity}
                    </Badge>
                  </div>
                }
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
