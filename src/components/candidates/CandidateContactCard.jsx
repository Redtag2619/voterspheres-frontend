import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function Row({ label, value, href }) {
  return (
    <div className="border-b border-white/10 py-3 last:border-b-0">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      {value ? (
        href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            className="mt-1 block break-words text-sm text-white hover:text-cyan-300"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 break-words text-sm text-white">{value}</p>
        )
      ) : (
        <p className="mt-1 text-sm text-slate-500">Not available</p>
      )}
    </div>
  );
}

function profileFromPayload(data, candidateFallback) {
  const profile =
    data?.profile ||
    data?.contact ||
    data?.contacts?.[0] ||
    data?.candidate?.profile ||
    null;

  const candidate = data?.candidate || candidateFallback || {};

  return { candidate, profile };
}

export default function CandidateContactCard({ candidate, candidateId }) {
  const resolvedCandidateId = candidateId || candidate?.id || candidate?.external_id;
  const [loading, setLoading] = useState(Boolean(resolvedCandidateId));
  const [enriching, setEnriching] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function loadContacts() {
    if (!resolvedCandidateId) return;

    try {
      setLoading(true);
      setError("");
      const result = await api.candidateContacts(resolvedCandidateId);
      setData(result);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load candidate contacts"
      );
    } finally {
      setLoading(false);
    }
  }

  async function enrichProfile() {
    if (!resolvedCandidateId) return;

    try {
      setEnriching(true);
      setError("");
      const result = await api.enrichCandidateProfile(resolvedCandidateId);
      setData(result);
      await loadContacts();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to refresh contact intelligence"
      );
    } finally {
      setEnriching(false);
    }
  }

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedCandidateId]);

  const { candidate: loadedCandidate, profile } = useMemo(
    () => profileFromPayload(data, candidate),
    [data, candidate]
  );

  const displayName =
    loadedCandidate?.full_name ||
    loadedCandidate?.name ||
    candidate?.full_name ||
    candidate?.name ||
    "Candidate";

  const contact = candidate?.contact || {};
  const email =
    profile?.email ||
    profile?.campaign_email ||
    contact?.campaign_email ||
    contact?.email;

  const pressEmail =
    profile?.press_contact_email ||
    profile?.press_email ||
    contact?.press_email;

  const phone = profile?.phone || contact?.phone;

  const campaignWebsite =
    profile?.campaign_website ||
    profile?.website ||
    contact?.campaign_website ||
    candidate?.website;

  const officialWebsite =
    profile?.official_website || contact?.official_website;

  const campaignAddress =
    profile?.campaign_address ||
    contact?.campaign_address ||
    [
      contact.address?.line1,
      contact.address?.line2,
      [contact.address?.city, contact.address?.state_code].filter(Boolean).join(", "),
      contact.address?.postal_code,
    ]
      .filter(Boolean)
      .join(" ");

  const officeAddress = profile?.office_address || contact?.office_address;

  const confidence = Number(
    profile?.contact_confidence ?? profile?.confidence_score ?? contact?.confidence ?? 0
  );

  const verified = Boolean(profile?.is_verified || contact?.verified);
  const source =
    profile?.source_label ||
    profile?.source ||
    contact?.source ||
    "candidate profile";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Contact Intelligence</h2>
          <p className="text-sm text-slate-400">
            Live campaign contact enrichment for {displayName}.
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            verified
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/15 text-amber-300"
          }`}
        >
          {verified ? "Verified" : "Unverified"}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
          {source}
        </span>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          Confidence {confidence}
        </span>

        <button
          type="button"
          onClick={enrichProfile}
          disabled={!resolvedCandidateId || enriching}
          className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enriching ? "Refreshing..." : "Refresh Contact Intel"}
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
          Loading contact intelligence...
        </div>
      ) : null}

      <Row
        label="Campaign Email"
        value={email}
        href={email ? `mailto:${email}` : undefined}
      />

      <Row
        label="Press Email"
        value={pressEmail}
        href={pressEmail ? `mailto:${pressEmail}` : undefined}
      />

      <Row
        label="Phone"
        value={phone}
        href={phone ? `tel:${phone}` : undefined}
      />

      <Row
        label="Campaign Website"
        value={campaignWebsite}
        href={campaignWebsite}
      />

      <Row
        label="Official Website"
        value={officialWebsite}
        href={officialWebsite}
      />

      <Row label="Campaign Headquarters" value={campaignAddress} />
      <Row label="Office Address" value={officeAddress} />

      <Row label="Campaign Manager" value={profile?.campaign_manager_name} />
      <Row label="Finance Director" value={profile?.finance_director_name} />
      <Row label="Political Director" value={profile?.political_director_name} />
      <Row label="Press Contact" value={profile?.press_contact_name} />

      <Row
        label="Last Updated"
        value={
          profile?.updated_at || contact?.last_updated
            ? new Date(profile?.updated_at || contact?.last_updated).toLocaleString()
            : null
        }
      />
    </div>
  );
}
