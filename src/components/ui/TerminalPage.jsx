import React from "react";

function TerminalPage({
  eyebrow,
  title,
  description,
  metrics = [],
  children
}) {
  return (
    <div className="vs-terminal-page">
      <section className="vs-terminal-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">{eyebrow}</div>
          <h1 className="vs-terminal-title">{title}</h1>
          <p className="vs-terminal-copy">{description}</p>
        </div>

        <div className="vs-terminal-hero-grid">
          {metrics.map((item) => (
            <div key={item.label} className="vs-terminal-stat-card">
              <div className="vs-terminal-stat-label">{item.label}</div>
              <div className="vs-terminal-stat-value">{item.value}</div>
              <div className={`vs-terminal-stat-delta ${item.tone || "neutral"}`}>
                {item.delta}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-terminal-grid">{children}</section>
    </div>
  );
}

export default TerminalPage;
