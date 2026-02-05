const API_BASE = "http://localhost:10000";

// ----------------------
// Elements
// ----------------------

const candidateSelect = document.getElementById("candidateSelect") as HTMLSelectElement;
const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const resultsDiv = document.getElementById("results") as HTMLDivElement;
const paginationDiv = document.getElementById("pagination") as HTMLDivElement;

// ----------------------
// State
// ----------------------

let currentPage = 1;
const limit = 10;

// ----------------------
// Load Dropdown
// ----------------------

async function loadCandidateDropdown() {
  try {
    const res = await fetch(`${API_BASE}/api/dropdowns/candidates`);
    const data = await res.json();

    candidateSelect.innerHTML = `<option value="">All Candidates</option>`;

    data.forEach((item: any) => {
      const opt = document.createElement("option");
      opt.value = item.full_name || item.name;
      opt.textContent = item.full_name || item.name;
      candidateSelect.appendChild(opt);
    });

  } catch (err) {
    console.error("Dropdown load failed", err);
  }
}

// ----------------------
// Load Candidates
// ----------------------

async function loadCandidates(page = 1) {
  try {
    const q = searchInput.value;
    const candidate = candidateSelect.value;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (q) params.append("q", q);
    if (candidate) params.append("name", candidate);

    const res = await fetch(`${API_BASE}/api/candidates?${params}`);
    const data = await res.json();

    renderResults(data.results);
    renderPagination(data.total, page);

  } catch (err) {
    console.error("Load failed", err);
  }
}

// ----------------------
// Render Results
// ----------------------

function renderResults(rows: any[]) {
  resultsDiv.innerHTML = "";

  if (!rows.length) {
    resultsDiv.innerHTML = "<p>No results found</p>";
    return;
  }

  rows.forEach(row => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <strong>${row.full_name}</strong><br/>
      Party: ${row.party || ""}<br/>
      Email: ${row.email || ""}<br/>
      Phone: ${row.phone || ""}<br/>
      Website: ${row.website || ""}
    `;

    resultsDiv.appendChild(div);
  });
}

// ----------------------
// Render Pagination
// ----------------------

function renderPagination(total: number, page: number) {
  paginationDiv.innerHTML = "";

  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i.toString();
    btn.disabled = i === page;

    btn.onclick = () => {
      currentPage = i;
      loadCandidates(i);
    };

    paginationDiv.appendChild(btn);
  }
}

// ----------------------
// Event Listeners
// ----------------------

searchInput.addEventListener("input", () => {
  currentPage = 1;
  loadCandidates();
});

candidateSelect.addEventListener("change", () => {
  currentPage = 1;
  loadCandidates();
});

// ----------------------
// Init
// ----------------------

loadCandidateDropdown();
loadCandidates();
