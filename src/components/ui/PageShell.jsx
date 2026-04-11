import DemoBanner from "./DemoBanner";

export default function PageShell({
  eyebrow,
  title,
  description,
  demo = false,
  demoText = "Demo mode is active for this module.",
  tickerItems = [],
  children,
}) {
  return (
    <div className="vs-page-shell">
      <section className="vs-page-hero">
        {eyebrow ? <div className="vs-page-eyebrow">{eyebrow}</div> : null}
        {title ? <h1 className="vs-page-title">{title}</h1> : null}
        {description ? <div className="vs-page-subtitle">{description}</div> : null}

        {tickerItems.length ? (
          <div className="vs-ticker-strip">
            {tickerItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="vs-ticker-pill">
                {item.dotClass ? <span className={item.dotClass} /> : null}
                <span>{item.label}</span>
                <strong style={{ color: "var(--vs-text)" }}>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        <DemoBanner active={demo} text={demoText} />
      </section>

      {children}
    </div>
  );
}
