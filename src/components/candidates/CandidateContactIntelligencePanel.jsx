import { useMemo, useState } from "react";
import Badge from "../ui/Badge";
import SectionCard from "../ui/SectionCard";
import EmptyState from "../ui/EmptyState";
import { api } from "../../services/api";

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

function tone(score) {
  const value = Number(score || 0);
  if (value >= 0.75) return "active";
  if (value >= 0.45) return "demo";
  return "danger";
}

function profileFrom(candidate = {}, profile = {}) {
  return {
    email: profile.email || candidate.contact_email || "",
    press_email: profile.press_contact_email || candidate.press_email || "",
    phone: profile.phone || candidate.phone || "",
    website: profile.campaign_website || candidate.website || "",
    official_website: profile.official_website || "",
    campaign_address: profile.campaign_address || "",
    office_address: profile.office_address || "",
    facebook_url: profile.facebook_url || candidate.facebook_url || "",
    x_url: profile.x_url || candidate.x_url || "",
    instagram_url: profile.instagram_url || candidate.instagram_url || "",
    youtube_url: profile.youtube_url || candidate.youtube_url || "",
    linkedin_url: profile.linkedin_url || candidate.linkedin_url || "",
    tiktok_url: profile.tiktok_url || candidate.tiktok_url || "",
    contact_confidence: profile.contact_confidence ?? candidate.contact_confidence ?? 0,
    contact_verified: profile.is_verified ?? candidate.contact_verified ?? false,
    source_label: profile.source_label || candidate.contact_source || "candidate_table",
    contact_source_url: profile.contact_source_url || candidate.contact_source_url || "",
    last_scraped_at: profile.last_scraped_at || candidate.last_scraped_at || candidate.last_contact_update || "",
  };
}

function LinkValue({ href, children }) {
  if (!href) return <span>—</span>;
  const safeHref = /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:") ? href : `https://${href}`;
  return <a href={safeHref} target={safeHref.startsWith("http") ? "_blank" : undefined} rel="noreferrer" style={styles.link}>{children || href}</a>;
}

function Row({ label, value, href }) {
  return (
    <div style={styles.row}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{href ? <LinkValue href={href}>{value || href}</LinkValue> : value || "—"}</div>
    </div>
  );
}

export default function CandidateContactIntelligencePanel({ candidate = {}, profile = {}, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const merged = useMemo(() => profileFrom(candidate, profile), [candidate, profile]);

  const socials = [
    ["Facebook", merged.facebook_url],
    ["X", merged.x_url],
    ["Instagram", merged.instagram_url],
    ["YouTube", merged.youtube_url],
    ["LinkedIn", merged.linkedin_url],
    ["TikTok", merged.tiktok_url],
  ].filter(([, url]) => Boolean(url));

  async function refreshProfile() {
    try {
      setRefreshing(true);
      setMessage("");
      setError("");
      await api.enrichCandidateProfile(candidate.id);
      setMessage("Candidate contact intelligence refreshed.");
      await onRefresh?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to refresh candidate profile.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SectionCard
      title="Contact Intelligence"
      subtitle="Campaign contact, website, social, source, and verification data."
      right={
        <div className="vs-inline-actions">
          <Badge tone={tone(merged.contact_confidence)}>{Math.round(Number(merged.contact_confidence || 0) * 100)}% confidence</Badge>
          <Badge tone={merged.contact_verified ? "active" : "demo"}>{merged.contact_verified ? "Verified" : "Unverified"}</Badge>
          <button type="button" className="vs-button vs-button-secondary" onClick={refreshProfile} disabled={refreshing || !candidate?.id}>
            {refreshing ? "Refreshing..." : "Refresh Profile"}
          </button>
        </div>
      }
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner" style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534" }}>{message}</div> : null}

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.heading}>Direct Contact</div>
          <Row label="Email" value={merged.email} href={merged.email ? `mailto:${merged.email}` : ""} />
          <Row label="Press" value={merged.press_email} href={merged.press_email ? `mailto:${merged.press_email}` : ""} />
          <Row label="Phone" value={merged.phone} href={merged.phone ? `tel:${merged.phone}` : ""} />
        </div>
        <div style={styles.card}>
          <div style={styles.heading}>Web Presence</div>
          <Row label="Campaign" value={merged.website} href={merged.website} />
          <Row label="Official" value={merged.official_website} href={merged.official_website} />
          <Row label="Source URL" value={merged.contact_source_url} href={merged.contact_source_url} />
        </div>
        <div style={styles.card}>
          <div style={styles.heading}>Address</div>
          <Row label="Campaign" value={merged.campaign_address} />
          <Row label="Office" value={merged.office_address} />
        </div>
        <div style={styles.card}>
          <div style={styles.heading}>Source & Audit</div>
          <Row label="Source" value={merged.source_label} />
          <Row label="Last Scraped" value={formatDate(merged.last_scraped_at)} />
          <Row label="Candidate ID" value={candidate.id} />
        </div>
      </div>

      <div style={styles.socialCard}>
        <div style={styles.heading}>Social Media</div>
        {!socials.length ? (
          <EmptyState text="No social links found yet. Run multi-page enrichment to improve social coverage." />
        ) : (
          <div style={styles.socialGrid}>
            {socials.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="vs-button vs-button-secondary">{label}</a>)}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" },
  card: { border: "1px solid rgba(148, 163, 184, 0.22)", borderRadius: "14px", padding: "14px", background: "rgba(15, 23, 42, 0.28)" },
  socialCard: { marginTop: "12px", border: "1px solid rgba(148, 163, 184, 0.22)", borderRadius: "14px", padding: "14px", background: "rgba(15, 23, 42, 0.20)" },
  heading: { fontWeight: 900, marginBottom: "10px" },
  row: { display: "grid", gridTemplateColumns: "120px 1fr", gap: "10px", padding: "7px 0", borderTop: "1px solid rgba(148, 163, 184, 0.12)" },
  label: { color: "var(--vs-text-muted, #94a3b8)", fontSize: "12px", fontWeight: 800 },
  value: { fontSize: "13px", fontWeight: 750, minWidth: 0, overflowWrap: "anywhere" },
  link: { color: "var(--vs-accent, #60a5fa)", textDecoration: "none" },
  socialGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
};

