const API = "http://localhost:10000/api";

const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const stateSelect = document.getElementById("stateSelect") as HTMLSelectElement;
const countySelect = document.getElementById("countySelect") as HTMLSelectElement;
const officeSelect = document.getElementById("officeSelect") as HTMLSelectElement;
const partySelect = document.getElementById("partySelect") as HTMLSelectElement;

const resultsDiv = document.getElementById("results")!;
const paginationDiv = document.getElementById("pagination")!;

const limit = 12;

/* ==========================
   LOAD DROPDOWNS
========================== */

async function loadStates() {
  const res = await fetch(`${API}/dropdowns/states`);
  const data = await res.json();

  data.forEach((s: any) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    stateSelect.appendChild(opt);
  });
}

async function loadCountiesByState(stateId: string) {
  if (!stateId) {
    countySelect.innerHTML = `<option value="">Select State First</option>`;
    countySelect.disabled = true;
    return;
  }

  countySelect.disabled = true;
  countySelect.innerHTML = `<option>Loading...</option>`;

  const res = await fetch(`${API}/dropdowns/counties?state=${stateId}`);
  const data = await res.json();

  countySelect.innerHTML = `<option value="">All Counties</option>`;

  data.forEach((c: any) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    countySelect.appendChild(opt);
  });

  countySelect.disabled = false;
}

async function loadOffices() {
  const res = await fetch(`${API}/dropdowns/offices`);
  const data = await res.json();

  data.forEach((o: any) => {
    const opt = document.createElement("option");
    opt.value = o.id;
    opt.textContent = o.name;
    officeSelect.appendChild(opt);
  });
}

async function loadParties() {
  const res = await fetch(`${API}/dropdowns/parties`);
  const data = await res.json();

  data.forEach((p: any) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    partySelect.appendChild(opt);
  });
}

/* ==========================
   LOAD CANDIDATES
========================== */

async function loadCandidates(page = 1) {
  const params = new URLSearchParams({
    q: searchInput.value,
    state: stateSelect.value,
    county: countySelect.value,
    office: officeSelect.value,
    party: partySelect.value,
    page: String(page),
    limit: String(limit),
  });

  const res = await fetch(`${API}/candidates?${params}`);
  const data = await res.json();

  renderResults(data.results);
  renderPagination(data.total, page);
}

/* ==========================
   RENDER RESULTS
========================== */

function renderResults(rows: any[]) {
  resultsDiv.innerHTML = "";

  rows.forEach((r) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="name">${r.full_name}</div>
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

searchInput.addEventListener("input", () => loadCandidates(1));

stateSelect.addEventListener("change", () => {
  loadCountiesByState(stateSelect.value);
  loadCandidates(1);
});

countySelect.addEventListener("change", () => loadCandidates(1));
officeSelect.addEventListener("change", () => loadCandidates(1));
partySelect.addEventListener("change", () => loadCandidates(1));

/* ==========================
   INIT
========================== */

loadStates();
loadOffices();
loadParties();
loadCandidates();
