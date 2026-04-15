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
            className="mt-1 block text-sm text-white hover:text-cyan-300"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 text-sm text-white">{value}</p>
        )
      ) : (
        <p className="mt-1 text-sm text-slate-500">Not available</p>
      )}
    </div>
  );
}

export default function CandidateContactCard({ candidate }) {
  const contact = candidate?.contact || {};
  const address = [
    contact.address?.line1,
    contact.address?.line2,
    [contact.address?.city, contact.address?.state_code]
      .filter(Boolean)
      .join(", "),
    contact.address?.postal_code,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Contact Intelligence</h2>
          <p className="text-sm text-slate-400">
            Verified campaign contact and channel details.
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            contact.verified
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/15 text-amber-300"
          }`}
        >
          {contact.verified ? "Verified" : "Unverified"}
        </span>
      </div>

      <Row
        label="Campaign Email"
        value={contact.campaign_email}
        href={contact.campaign_email ? `mailto:${contact.campaign_email}` : undefined}
      />

      <Row
        label="Press Email"
        value={contact.press_email}
        href={contact.press_email ? `mailto:${contact.press_email}` : undefined}
      />

      <Row
        label="Phone"
        value={contact.phone}
        href={contact.phone ? `tel:${contact.phone}` : undefined}
      />

      <Row label="Headquarters" value={address} />
      <Row label="Source" value={contact.source} />
      <Row
        label="Last Updated"
        value={
          contact.last_updated
            ? new Date(contact.last_updated).toLocaleString()
            : null
        }
      />

      <div className="pt-4">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">
          Social Channels
        </p>

        <div className="flex flex-wrap gap-2">
          {contact.social?.facebook ? (
            <a
              href={contact.social.facebook}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              Facebook
            </a>
          ) : null}

          {contact.social?.x ? (
            <a
              href={contact.social.x}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              X
            </a>
          ) : null}

          {contact.social?.instagram ? (
            <a
              href={contact.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              Instagram
            </a>
          ) : null}

          {contact.social?.youtube ? (
            <a
              href={contact.social.youtube}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              YouTube
            </a>
          ) : null}

          {contact.social?.linkedin ? (
            <a
              href={contact.social.linkedin}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              LinkedIn
            </a>
          ) : null}

          {!contact.social?.facebook &&
          !contact.social?.x &&
          !contact.social?.instagram &&
          !contact.social?.youtube &&
          !contact.social?.linkedin ? (
            <p className="text-sm text-slate-500">No social links on file.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
