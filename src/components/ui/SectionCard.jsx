export default function SectionCard({
  title,
  subtitle,
  right,
  children,
}) {
  return (
    <section className="vs-section-card">
      <div className="vs-section-head">
        <div className="vs-section-title-wrap">
          <h3 className="vs-section-title">{title}</h3>
          {subtitle ? <div className="vs-section-subtitle">{subtitle}</div> : null}
        </div>

        {right ? <div>{right}</div> : null}
      </div>

      {children}
    </section>
  );
}
