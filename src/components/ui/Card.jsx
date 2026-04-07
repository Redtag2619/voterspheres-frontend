export default function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        ...style
      }}
    >
      {children}
    </div>
  );
}
