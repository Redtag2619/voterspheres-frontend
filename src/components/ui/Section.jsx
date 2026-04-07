export default function Section({ title, right, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      {(title || right) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px"
          }}
        >
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#f9fafb",
              letterSpacing: "0.04em"
            }}
          >
            {title}
          </h2>

          {right}
        </div>
      )}

      {children}
    </div>
  );
}
