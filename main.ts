const API = "http://localhost:10000/api";

const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const stateSelect = document.getElementById("stateSelect") as HTMLSelectElement;
const partySelect = document.getElementById("partySelect") as HTMLSelectElement;
const resultsDiv = document.getElementById("results")!;
const paginationDiv = document.getElementById("pagination")!;

let currentPage = 1;
const limit = 12;

/* ========================
   LOAD DROPDOWNS
======================== */

async function loadStates() {
  const res = await fetch(`${API}/dropdowns/states`);
  const states = await res.json();

  states.forEach((s:any) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    stateSelect.appendChild(opt);
  });
}

async function loadParties() {
  const res = await fetch(`${API}/dropdowns/parties`);
  const parties = await res.json();

  parties.forEach((p:any) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    partySelect.appendChild(opt);
  });
}

/* ========================
   LOAD CANDIDATES
======================== */

async function loadCandidates(page = 1) {
  currentPage = page;

  const q = searchInput.value;
  const state = stateSelect.value;
  const party = partySelect.value;

  const params = new URLSearchParams({
    q,
    state,
    party,
    page: String(page),
    limit: String(limit)
  });

  const res = await fetch(`${API}/candidates?${params}`);
  const data = await res.json();

  renderResults(data.results);
  renderPagination(data.total, page);
}

/* ========================
   RENDER RESULTS
======================== */

function renderResults(rows:any[]) {
  resultsDiv.innerHTML = "";

  rows.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="name">${c.full_name}</div>
      <div class="row">Party: ${c.party_name || ""}</div>
      <div class="row">State: ${c.state_name || ""}</div>
      <div class="row">Email: ${c.email || ""}</div>
      <div class="row">Phone: ${c.phone || ""}</div>
    `;

    resultsDiv.appendChild(div);
  });
}

/* ========================
   PAGINATION
======================== */

function renderPagination(total:number, page:number) {
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

/* ========================
   EVENTS
======================== */

searchInput.addEventListener("input", () => loadCandidates(1));
stateSelect.addEventListener("change", () => loadCandidates(1));
partySelect.addEventListener("change", () => loadCandidates(1));

/* ========================
   INIT
======================== */

loadStates();
loadParties();
loadCandidates();
