import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function normalizeName(candidate) {
  return (
    candidate?.full_name ||
    [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ") ||
    "Candidate"
  );
}

const emptyForm = {
  campaign_website: "",
  official_website: "",
  office_address: "",
  campaign_address: "",
  phone: "",
  email: "",
  chief_of_staff_name: "",
  campaign_manager_name: "",
  finance_director_name: "",
  political_director_name: "",
  press_contact_name: "",
  press_contact_email: "",
  source_label: "manual_enrichment",
  notes: ""
};

function FormField({ label, value, onChange, placeholder = "" }) {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <div className="vs-stat-label">{label}</div>
      <input
        className="vs-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  );
}

function FormTextArea({ label, value, onChange, placeholder = "" }) {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <div className="vs-stat-label">{label}</div>
      <textarea
        className="vs-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={5}
        style={{ resize: "vertical" }}
      />
    </label>
  );
}

export default function CandidateProfilesAdmin() {
  const [search, setSearch] = useState("");
  const [directory, setDirectory] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;

    async function loadDirectory() {
      try {
        setLoadingDirectory(true);
        const response = await api.get("/candidate-profiles/admin-directory", {
          params: { q: search, page: 1, limit: 50 },
          timeout: 7000
        });

        if (!active) return;
        const results = response?.data?.results || [];
        setDirectory(results);

        if (results.length && !selectedCandidate) {
          setSelectedCandidate(results[0]);
        } else if (
          selectedCandidate &&
          !results.some((item) => String(item.id) === String(selectedCandidate.id))
        ) {
          setSelectedCandidate(results[0] || null);
        }
      } catch {
        if (!active) return;
        setDirectory([]);
      } finally {
        if (active) setLoadingDirectory(false);
      }
    }

    loadDirectory();

    return () => {
      active = false;
    };
  }, [search]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!selectedCandidate?.id) {
        setForm(emptyForm);
        return;
      }

      try {
        setLoadingProfile(true);
        setBanner("");

        const response = await api.get(`/candidate-profiles/${selectedCandidate.id}`, {
          timeout: 7000
        });

        if (!active) return;

        const profile = response?.data?.profile || {};
        setForm({
          campaign_website: profile.campaign_website || "",
          official_website: profile.official_website || "",
          office_address: profile.office_address || "",
          campaign_address: profile.campaign_address || "",
          phone: profile.phone || "",
          email: profile.email || "",
          chief_of_staff_name: profile.chief_of_staff_name || "",
          campaign_manager_name: profile.campaign_manager_name || "",
          finance_director_name: profile.finance_director_name || "",
          political_director_name: profile.political_director_name || "",
          press_contact_name: profile.press_contact_name || "",
          press_contact_email: profile.press_contact_email || "",
          source_label: profile.source_label || "manual_enrichment",
          notes: profile.notes || ""
        });
      } catch {
        if (!active) return;
        setForm(emptyForm);
      } finally {
        if (active) setLoadingProfile(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [selectedCandidate?.id]);

  const selectedName = useMemo(
    () => normalizeName(selectedCandidate),
    [selectedCandidate]
  );

  async function handleSave() {
    if (!selectedCandidate?.id) return;

    try {
      setSaving(true);
      setBanner("");

      await api.put(`/candidate-profiles/${selectedCandidate.id}`, form, {
        timeout: 7000
      });

      setBanner("Profile saved.");
    } catch (err) {
      setBanner(
        err?.response?.data?.error || err?.message || "Failed to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedCandidate?.id) return;

    try {
      setSaving(true);
      setBanner("");

      await api.delete(`/candidate-profiles/${selectedCandidate.id}`, {
        timeout: 7000
      });

      setForm(emptyForm);
      setBanner("Profile deleted.");
    } catch (err) {
      setBanner(
        err?.response?.data?.error || err?.message || "Failed to delete profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      eyebrow="Admin"
      title="Candidate Profile Enrichment"
      description="Manage candidate staff, contact, and campaign enrichment fields."
    >
      {banner ? (
        <div className="vs-banner">
          {banner}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 0.9fr) minmax(0, 1.3fr)",
          gap: "16px",
          alignItems: "start"
        }}
      >
        <SectionCard
          title="Candidates"
          subtitle="Search and select a candidate to edit."
        >
          <div style={{ display: "grid", gap: "12px" }}>
            <input
              className="vs-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, state, or office..."
            />

            {loadingDirectory ? (
              <EmptyState text="Loading candidates..." />
            ) : !directory.length ? (
              <EmptyState text="No candidates found." />
            ) : (
              <div className="vs-stack">
                {directory.map((candidate) => {
                  const active =
                    String(candidate.id) === String(selectedCandidate?.id);

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedCandidate(candidate)}
                      className="vs-card"
                      style={{
                        textAlign: "left",
                        padding: "14px",
                        cursor: "pointer",
                        border: active
                          ? "1px solid rgba(99, 102, 241, 0.55)"
                          : undefined,
                        boxShadow: active
                          ? "0 0 0 1px rgba(99, 102, 241, 0.18)"
                          : undefined
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "10px",
                          alignItems: "flex-start"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--vs-text)" }}>
                            {normalizeName(candidate)}
                          </div>
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "12px",
                              color: "var(--vs-text-muted)"
                            }}
                          >
                            {candidate.office || "Office"} • {candidate.state || "State"}
                          </div>
                        </div>

                        <Badge tone={candidate.has_profile ? "active" : "default"}>
                          {candidate.has_profile ? "Profile" : "No Profile"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={selectedCandidate ? selectedName : "Profile Editor"}
          subtitle={
            selectedCandidate
              ? `${selectedCandidate.office || "Office"} • ${selectedCandidate.state || "State"}`
              : "Select a candidate to edit enrichment fields."
          }
        >
          {!selectedCandidate ? (
            <EmptyState text="Select a candidate to begin editing." />
          ) : loadingProfile ? (
            <EmptyState text="Loading profile..." />
          ) : (
            <div className="vs-stack">
              <SectionCard title="Web + Contact" subtitle="Campaign and office contact fields.">
                <div className="vs-grid-2">
                  <FormField
                    label="Campaign Website"
                    value={form.campaign_website}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, campaign_website: e.target.value }))
                    }
                  />
                  <FormField
                    label="Official Website"
                    value={form.official_website}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, official_website: e.target.value }))
                    }
                  />
                  <FormField
                    label="Phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                  <FormField
                    label="Email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                  <FormField
                    label="Office Address"
                    value={form.office_address}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, office_address: e.target.value }))
                    }
                  />
                  <FormField
                    label="Campaign Address"
                    value={form.campaign_address}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, campaign_address: e.target.value }))
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Campaign Team" subtitle="Key staff and press fields.">
                <div className="vs-grid-2">
                  <FormField
                    label="Chief of Staff"
                    value={form.chief_of_staff_name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, chief_of_staff_name: e.target.value }))
                    }
                  />
                  <FormField
                    label="Campaign Manager"
                    value={form.campaign_manager_name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, campaign_manager_name: e.target.value }))
                    }
                  />
                  <FormField
                    label="Finance Director"
                    value={form.finance_director_name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, finance_director_name: e.target.value }))
                    }
                  />
                  <FormField
                    label="Political Director"
                    value={form.political_director_name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, political_director_name: e.target.value }))
                    }
                  />
                  <FormField
                    label="Press Contact"
                    value={form.press_contact_name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, press_contact_name: e.target.value }))
                    }
                  />
                  <FormField
                    label="Press Contact Email"
                    value={form.press_contact_email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, press_contact_email: e.target.value }))
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Metadata" subtitle="Source label and internal notes.">
                <div className="vs-grid-2">
                  <FormField
                    label="Source Label"
                    value={form.source_label}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, source_label: e.target.value }))
                    }
                  />
                </div>

                <div style={{ marginTop: "12px" }}>
                  <FormTextArea
                    label="Notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
              </SectionCard>

              <div className="vs-inline-actions">
                <button
                  type="button"
                  className="vs-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>

                <button
                  type="button"
                  className="vs-button vs-button-secondary"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Delete Profile
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
