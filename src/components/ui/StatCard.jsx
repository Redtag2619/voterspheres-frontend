import React from "react";

export default function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  subtext
}) {
  const toneClass =
    tone === "up"
      ? "vs-tone-up"
      : tone === "down"
      ? "vs-tone-down"
      : "vs-tone-neutral";

  return (
    <div className="vs-card">
      <div className="vs-stat-label">{label}</div>
      <div className="vs-stat-value">{value}</div>
      {delta ? <div className={`vs-stat-delta ${toneClass}`}>{delta}</div> : null}
      {subtext ? <div className="vs-stat-delta vs-tone-neutral">{subtext}</div> : null}
    </div>
  );
}
