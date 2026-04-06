import React from "react";

export default function PageShell({
  eyebrow,
  title,
  description,
  demo = false,
  demoText = "Demo mode is active.",
  children
}) {
  return (
    <div className="vs-page">
      <div className="vs-page-inner">
        <section className="vs-hero">
          {eyebrow ? <div className="vs-eyebrow">{eyebrow}</div> : null}
          {title ? <h1 className="vs-title">{title}</h1> : null}
          {description ? <p className="vs-description">{description}</p> : null}
          {demo ? <div className="vs-banner vs-banner-demo">{demoText}</div> : null}
        </section>
        {children}
      </div>
    </div>
  );
}
