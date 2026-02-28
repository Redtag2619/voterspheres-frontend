const API = import.meta.env.VITE_API_URL;

const limit = 10;

/* ==========================
   SAFE ELEMENT GETTERS
========================== */

function getInput(id: string): HTMLInputElement | null {
  return document.getElementById(id) as HTMLInputElement | null;
}

function getSelect(id: string): HTMLSelectElement | null {
  return document.getElementById(id) as HTMLSelectElement | null;
}

function getDiv(id: string): HTMLElement | null {
  return document.getElementById(id);
}

/* ==========================
   LOAD DROPDOWNS
========================== */

async function loadStates() {
  const stateSelect = getSelect("stateSelect");
  if (!stateSelect) return;

  try {
    const res = await fetch(`${API}/dropdowns/states`);
    const data = await res.json();

    stateSelect.innerHTML = `<option value="">All States</option>`;

    (Array.isArray(data) ? data : []).forEach((s: any) => {
      const value = s.state || s.id || "";
      const label = s.state || s.name || "";

      if (!value) return;

      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      stateSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("States load error:", err);
  }
}

async function loadOffices() {
  const officeSelect = getSelect("officeSelect");
  if (!officeSelect) return;

  try {
    const res = await fetch(`${API}/dropdowns/offices`);
    const data = await res.json();

    officeSelect.innerHTML = `<option value="">All Offices</option>`;

    (Array.isArray(data) ? data : []).forEach((o: any) => {
      const value = o.office || o.id || "";
      const label = o.office || o.name || "";

      if (!value) return;

      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      officeSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Offices load error:", err);
  }
}

async function loadParties() {
  const partySelect = getSelect("partySelect");
  if (!partySelect) return;

  try {
    const res = await fetch(`${API}/dropdowns/parties`);
    const data = await res.json();

    partySelect.innerHTML = `<option value="">All Parties</option>`;

    (Array.isArray(data) ? data : []).forEach((p: any) => {
      const value = p.party || p.id || "";
      const label = p.party || p.name || "";

      if (!value) return;

      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      partySelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Parties load error:", err);
  }
}

/* ==========================
   LOAD CANDIDATES
========================== */

async function loadCandidates(page = 1) {
  const searchInput = getInput("searchInput");
  const stateSelect = getSelect("stateSelect");
  const countySelect = getSelect("countySelect");
  const officeSelect = getSelect("officeSelect");
  const partySelect = getSelect("partySelect");

  const params = new URLSearchParams({
    q: searchInput?.value || "",
    state: stateSelect?.value || "",
    county: countySelect?.value || "",
    office: officeSelect?.value || "",
    party: partySelect?.value || "",
    page: String(page),
    limit: String(limit),
  });

  try {
    const res = await fetch(`${API}/candidates?${params}`);
    const data = await res.json();

    renderResults(Array.isArray(data.results) ? data.results : []);
    renderPagination(data.total || 0, page);
  } catch (err) {
    console.error("Candidates load error:", err);
  }
}

/* ==========================
   RENDER RESULTS
========================== */

function renderResults(rows: any[]) {
  const resultsDiv = getDiv("results");
  if (!resultsDiv) return;

  resultsDiv.innerHTML = "";

  rows.forEach((r) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="name">${r.full_name || ""}</div>
      <div class="row">Office: ${r.office_name || ""}</div>
      <div class="row">County: ${r.county_name || ""}</div>
      <div class="row">State: ${r.state_name || ""}</div>
      <div class="row">Party: ${r.party_name || ""}</div>
      <div class="row">Email: ${r.email || ""}</div>
      <div class="row">Phone: ${r.phone || ""}</div>
    `;

    resultsDiv.appendChild(div);
  });
}

/* ==========================
   PAGINATION
========================== */

function renderPagination(total: number, page: number) {
  const paginationDiv = getDiv("pagination");
  if (!paginationDiv) return;

  paginationDiv.innerHTML = "";

  const pages = Math.ceil(total / limit);

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.textContent = String(i);
    btn.disabled = i === page;
    btn.onclick = () => loadCandidates(i);
    paginationDiv.appendChild(btn);
  }
}

/* ==========================
   EVENTS
========================== */

function attachEvents() {
  const searchInput = getInput("searchInput");
  const stateSelect = getSelect("stateSelect");
  const countySelect = getSelect("countySelect");
  const officeSelect = getSelect("officeSelect");
  const partySelect = getSelect("partySelect");

  searchInput?.addEventListener("input", () => loadCandidates(1));

  stateSelect?.addEventListener("change", () => {
    loadCandidates(1);
  });

  countySelect?.addEventListener("change", () => loadCandidates(1));
  officeSelect?.addEventListener("change", () => loadCandidates(1));
  partySelect?.addEventListener("change", () => loadCandidates(1));
}

/* ==========================
   INIT
========================== */

document.addEventListener("DOMContentLoaded", () => {
  attachEvents();
  loadStates();
  loadOffices();
  loadParties();
  loadCandidates();
});
