export default function Page({ children }) {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px"
      }}
    >
      {children}
    </div>
  );
}
