import React, { useEffect, useId, useState } from "react";

export default function CollapsibleSection({ id, title, subtitle, right = null, children, defaultOpen = true, open: controlledOpen, onOpenChange, className = "", bodyClassName = "", actions = null, scrollMarginTop = 132 }) {
  const fallbackId = useId();
  const sectionId = id || `vs-section-${fallbackId}`;
  const bodyId = `${sectionId}-body`;
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(Boolean(defaultOpen));
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (!isControlled) setInternalOpen(Boolean(defaultOpen));
  }, [defaultOpen, isControlled]);

  function toggleOpen() {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    if (typeof onOpenChange === "function") onOpenChange(next);
  }

  return (
    <section id={sectionId} className={["vs-collapsible-section", className].filter(Boolean).join(" ")} style={{ scrollMarginTop }}>
      <style>{`
        .vs-collapsible-section{border:1px solid rgba(148,163,184,.16);border-radius:22px;background:var(--vs-panel-bg,#111827);box-shadow:none;min-width:0;max-width:100%;overflow:hidden;padding:16px}
        .vs-collapsible-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;min-width:0;flex-wrap:wrap}
        .vs-collapsible-section-copy{min-width:0;flex:1 1 320px}.vs-collapsible-section-copy h3{margin:0;color:var(--vs-text,#f8fafc);font-size:18px;font-weight:950;line-height:1.25;overflow-wrap:anywhere}
        .vs-collapsible-section-copy p{margin:6px 0 0;color:var(--vs-text-muted,#94a3b8);font-size:12px;line-height:1.5;overflow-wrap:anywhere}
        .vs-collapsible-section-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;min-width:0}
        .vs-collapsible-section-toggle{border:1px solid rgba(148,163,184,.18);border-radius:999px;background:rgba(15,23,42,.86);color:var(--vs-text,#f8fafc);cursor:pointer;font-size:11px;font-weight:900;letter-spacing:.08em;min-height:34px;padding:9px 12px;text-transform:uppercase;transition:border-color .16s ease,color .16s ease,background .16s ease,transform .16s ease}
        .vs-collapsible-section-toggle:hover{border-color:rgba(251,146,60,.52);background:rgba(251,146,60,.1);color:#fed7aa;transform:translateY(-1px)}
        .vs-collapsible-section-toggle:focus-visible{outline:2px solid rgba(251,146,60,.85);outline-offset:2px}
        .vs-collapsible-section-body{margin-top:16px;min-width:0}.vs-collapsible-section-body.is-closed{display:none}
        @media(max-width:720px){.vs-collapsible-section-head,.vs-collapsible-section-actions{flex-direction:column;align-items:stretch}.vs-collapsible-section-toggle{width:100%}}
      `}</style>
      <div className="vs-collapsible-section-head">
        <div className="vs-collapsible-section-copy">{title ? <h3>{title}</h3> : null}{subtitle ? <p>{subtitle}</p> : null}</div>
        <div className="vs-collapsible-section-actions">
          {right}{actions}
          <button type="button" className="vs-collapsible-section-toggle" onClick={toggleOpen} aria-expanded={open} aria-controls={bodyId}>{open ? "Collapse Section" : "Open Section"}</button>
        </div>
      </div>
      <div id={bodyId} className={["vs-collapsible-section-body", open ? "" : "is-closed", bodyClassName].filter(Boolean).join(" ")}>{children}</div>
    </section>
  );
}

