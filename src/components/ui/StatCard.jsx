export default function StatCard({
  label,
  value,
  delta,
  subtext,
  tone = "neutral",
}) {
  const deltaClass =
    tone === "up"
      ? "vs-stat-delta vs-stat-delta-up"
      : tone === "down"
      ? "vs-stat-delta vs-stat-delta-down"
      : "vs-stat-delta vs-stat-delta-neutral";

  return (
    <div className="vs-stat">
      <div className="vs-stat-label">{label}</div>
      <div className="vs-stat-value" title={String(value ?? "")}>
        {value}
      </div>
      {delta ? <div className={deltaClass}>{delta}</div> : null}
      {!delta && subtext ? <div className="vs-stat-delta">{subtext}</div> : null}
    </div>
  );
}
