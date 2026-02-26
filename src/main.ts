const API_BASE = "https://voterspheres-backend-2pap.onrender.com";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <div style="font-family: Arial; padding:20px;">
      <h1>VoterSphere</h1>

      <input id="searchInput" placeholder="Search voters..." style="padding:8px;width:300px;" />
      <button id="searchBtn">Search</button>
      <button id="importBtn">Import Sample Data</button>

      <div id="results" style="margin-top:20px;"></div>
    </div>
  `;
}

const resultsDiv = document.getElementById("results") as HTMLDivElement;

async function searchVoters() {
  const input = document.getElementById("searchInput") as HTMLInputElement;
  const query = input.value;

  resultsDiv.innerHTML = "Searching...";

  try {
    const res = await fetch(`${API_BASE}/api/voters/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.length) {
      resultsDiv.innerHTML = "No voters found.";
      return;
    }

    resultsDiv.innerHTML = data
      .map(
        (v: any) => `
        <div style="padding:10px;border-bottom:1px solid #ccc;">
          <strong>${v.first_name || ""} ${v.last_name || ""}</strong><br/>
          ${v.city || ""}, ${v.state || ""}
        </div>
      `
      )
      .join("");
  } catch (err) {
    resultsDiv.innerHTML = "Error connecting to server.";
    console.error(err);
  }
}

async function importData() {
  resultsDiv.innerHTML = "Importing data...";

  try {
    await fetch(`${API_BASE}/api/import`, { method: "POST" });
    resultsDiv.innerHTML = "Import complete.";
  } catch (err) {
    resultsDiv.innerHTML = "Import failed.";
    console.error(err);
  }
}

document.getElementById("searchBtn")?.addEventListener("click", searchVoters);
document.getElementById("importBtn")?.addEventListener("click", importData);
