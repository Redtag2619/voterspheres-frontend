export default function Admin() {
  const importData = async () => {
    await fetch("https://voterspheres-backend-2pap.onrender.com/admin/import");
    alert("Import started");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Panel</h1>

      <button onClick={importData}>
        Import Nationwide Candidates
      </button>
    </div>
  );
}
