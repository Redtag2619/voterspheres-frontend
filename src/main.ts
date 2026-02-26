const API_BASE = "https://voterspheres-backend-2pap.onrender.com";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <div style="font-family: Arial; padding:20px; max-width:800px; margin:auto;">
      <h1>🗳️ VoterSphere</h1>

      <div style="margin-bottom:20px;">
        <input 
          id="searchInput" 
          placeholder="Search voters by name..." 
          style="padding:10px;width:300px;"
        />
        <button id="searchBtn">Search</button>
        <button id="importBtn">Import Sample Data</button>
      </div>

      <div id="results"></div>
    </div>
  `;
}

const resultsDiv = document.getElementById("results") as HTMLDivElement;

async function searchVoters() {
  const input = document.getElementById("searchInput") as HTMLInputElement;
  const query = input.value.trim();

  if (!query) {
    resultsDiv.innerHTML = "Enter a name to search.";
    return;
  }

  resultsDiv.innerHTML = "Searching...";

  try {
    const res = await fetch(
      `${API_BASE}/api/voters/search?q=${encodeURIComponent(query)}`
    );

    const data = await res.json();

    if (!data.length) {
      resultsDiv.innerHTML = "No voters found.";
      return;
    }

    resultsDiv.innerHTML = data
      .map(
        (v: any) => `
        <div style="padding:12px;border-bottom:1px solid #ddd;">
          <strong>${v.first_name || ""} ${v.last_name || ""}</strong><br/>
          ${v.city || ""}, ${v.state || ""}
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = "Server error.";
  }
}

async function importData() {
  resultsDiv.innerHTML = "Importing data...";

  try {
    await fetch(`${API_BASE}/api/import`, {
      method: "POST",
    });

    resultsDiv.innerHTML = "Import complete.";
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = "Import failed.";
  }
}

document.getElementById("searchBtn")?.addEventListener("click", searchVoters);
document.getElementById("importBtn")?.addEventListener("click", importData);
