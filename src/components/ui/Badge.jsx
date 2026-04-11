const toneClassMap = {
  default: "vs-badge-default",
  accent: "vs-badge-accent",
  active: "vs-badge-active",
  danger: "vs-badge-danger",
  demo: "vs-badge-demo",
  info: "vs-badge-info",
};

export default function Badge({
  tone = "default",
  children,
  className = "",
  title,
}) {
  const toneClass = toneClassMap[tone] || toneClassMap.default;
  const mergedClassName = ["vs-badge", toneClass, className].filter(Boolean).join(" ");

  return (
    <span className={mergedClassName} title={title || (typeof children === "string" ? children : undefined)}>
      {children}
    </span>
  );
}
