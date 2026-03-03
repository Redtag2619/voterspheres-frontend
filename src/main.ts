import {
  fetchStates,
  fetchOffices,
  fetchParties,
  fetchCandidates,
} from "./api";

const limit = 10;

/* ==========================
   ELEMENT HELPERS
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
    const data = await fetchStates();

    stateSelect.innerHTML = `<option value="">All States</option>`;

    (Array.isArray(data) ? data : []).forEach((s: any) => {
      const opt = document.createElement("option");
      opt.value = s.state;
      opt.textContent = s.state;
      stateSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadOffices() {
  const officeSelect = getSelect("officeSelect");
  if (!officeSelect) return;

  try {
    const data = await fetchOffices();

    officeSelect.innerHTML = `<option value="">All Offices</option>`;

    (Array.isArray(data) ? data : []).forEach((o: any) => {
      const opt = document.createElement("option");
      opt.value = o.office;
      opt.textContent = o.office;
      officeSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadParties() {
  const partySelect = getSelect("partySelect");
  if (!partySelect) return;

  try {
    const data = await fetchParties();

    partySelect.innerHTML = `<option value="">All Parties</option>`;

    (Array.isArray(data) ? data : []).forEach((p: any) => {
      const opt = document.createElement("option");
      opt.value = p.party;
      opt.textContent = p.party;
      partySelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

/* ==========================
   RENDER RESULTS
========================== */

function renderResults(rows: any[]) {
  const resultsDiv = getDiv("results");
  if (!resultsDiv) return;

  resultsDiv.innerHTML = "";

  if (!rows.length) {
    resultsDiv.innerHTML =
      "<div style='padding:20px;'>No candidates found.</div>";
    return;
  }

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
   LOAD CANDIDATES
========================== */

async function loadCandidates(page = 1) {
  try {
    const data = await fetchCandidates({
      q: getInput("searchInput")?.value,
      state: getSelect("stateSelect")?.value,
      county: getSelect("countySelect")?.value,
      office: getSelect("officeSelect")?.value,
      party: getSelect("partySelect")?.value,
      page,
    });

    renderResults(Array.isArray(data.results) ? data.results : []);
    renderPagination(data.total || 0, page);
  } catch (err) {
    console.error(err);
  }
}

/* ==========================
   EVENTS
========================== */

function attachEvents() {
  getInput("searchInput")?.addEventListener("input", () =>
    loadCandidates(1)
  );

  ["stateSelect", "countySelect", "officeSelect", "partySelect"].forEach(
    (id) => {
      getSelect(id)?.addEventListener("change", () =>
        loadCandidates(1)
      );
    }
  );
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
