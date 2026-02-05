const API = "http://localhost:10000";

let currentPage = 1;

async function loadCandidates(page = 1) {
  currentPage = page;

  const q = document.getElementById("search").value;

  const res = await fetch(
    `${API}/api/candidates?q=${q}&page=${page}&limit=10`
  );

  const data = await res.json();

  const container = document.getElementById("results");
  container.innerHTML = "";

  data.results.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${c.full_name}</strong><br>
      ${c.email || ""}<br>
      ${c.phone || ""}
    `;

    div.onclick = () => {
      window.location.href = `profile.html?id=${c.id}`;
    };

    container.appendChild(div);
  });

  renderPagination(data.totalPages);
}

function renderPagination(total) {
  const p = document.getElementById("pagination");
  p.innerHTML = "";

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.onclick = () => loadCandidates(i);
    p.appendChild(btn);
  }
}

loadCandidates();
