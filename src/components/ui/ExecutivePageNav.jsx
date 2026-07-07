import React from "react";

export default function ExecutivePageNav({ sections = [], title = "Page Navigation", align = "left", compact = false, className = "" }) {
  function scrollToSection(id) {
    if (!id || typeof document === "undefined") return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const safeSections = Array.isArray(sections) ? sections.filter((s) => s?.id && s?.label) : [];
  if (!safeSections.length) return null;

  return (
    <nav className={["vs-exec-page-nav", compact ? "is-compact" : "", align === "center" ? "is-centered" : "", className].filter(Boolean).join(" ")} aria-label={title}>
      <style>{`
        .vs-exec-page-nav{position:sticky;top:76px;z-index:20;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px;border:1px solid rgba(148,163,184,.16);border-radius:18px;background:rgba(15,23,42,.92);backdrop-filter:blur(16px);box-shadow:0 18px 36px rgba(0,0,0,.18);min-width:0}
        .vs-exec-page-nav.is-centered{justify-content:center}.vs-exec-page-nav.is-compact{padding:8px;gap:7px}
        .vs-exec-page-nav-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;border:1px solid rgba(148,163,184,.18);border-radius:999px;background:rgba(15,23,42,.86);color:var(--vs-text,#f8fafc);cursor:pointer;font-size:11px;font-weight:900;letter-spacing:.08em;line-height:1;padding:9px 12px;text-transform:uppercase;transition:border-color .16s ease,color .16s ease,background .16s ease,transform .16s ease;white-space:nowrap}
        .vs-exec-page-nav-button:hover{border-color:rgba(251,146,60,.52);background:rgba(251,146,60,.1);color:#fed7aa;transform:translateY(-1px)}
        .vs-exec-page-nav-button:focus-visible{outline:2px solid rgba(251,146,60,.85);outline-offset:2px}
        .vs-exec-page-nav-badge{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:999px;background:rgba(251,146,60,.14);color:#fed7aa;font-size:10px;font-weight:950;letter-spacing:0;padding:0 6px}
        @media(max-width:980px){.vs-exec-page-nav{position:static}}
        @media(max-width:640px){.vs-exec-page-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.vs-exec-page-nav-button{width:100%;min-width:0;white-space:normal;line-height:1.2}}
      `}</style>
      {safeSections.map((section) => (
        <button key={section.id} type="button" className="vs-exec-page-nav-button" onClick={() => scrollToSection(section.id)} aria-label={`Jump to ${section.label}`}>
          <span>{section.label}</span>
          {section.badge !== undefined && section.badge !== null ? <span className="vs-exec-page-nav-badge">{section.badge}</span> : null}
        </button>
      ))}
    </nav>
  );
}

