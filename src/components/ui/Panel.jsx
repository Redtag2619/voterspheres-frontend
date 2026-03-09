import React from "react";

function Panel({ title, subtitle, action, large = false, children }) {
  return (
    <div className={`vs-card vs-terminal-panel ${large ? "vs-terminal-panel-large" : ""}`}>
      <div className="vs-card-header">
        <div>
          <div className="vs-card-title">{title}</div>
          <div className="vs-card-subtitle">{subtitle}</div>
        </div>

        {action ? <button className="vs-card-link">{action}</button> : null}
      </div>

      {children}
    </div>
  );
}

export default Panel;
