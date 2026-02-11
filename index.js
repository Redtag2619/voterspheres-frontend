const API_BASE = "https://api.voterspheres.org";

const app = document.getElementById("app");
const slug = window.location.pathname.replace("/", "");

if (!slug) {
  loadHomepage();
} else {
  loadCandidate(slug);
}

/* =============================
   HOMEPAGE
============================= */
async function loadHomepage() {
  const res = await fetch(`${API_BASE}/api/candidates`);
  const candidates = await res.json();

  app.innerHTML = `
    <h1>VoterSpheres</h1>
    <ul>
      ${candidates
        .map(
          c =>
            `<li>
              <a href="/${c.slug}">
                ${c.full_name} — ${c.office} (${c.state})
              </a>
            </li>`
        )
        .join("")}
    </ul>
  `;
}

/* =============================
   CANDIDATE PROFILE
============================= */
async function loadCandidate(slug) {
  const res = await fetch(`${API_BASE}/api/candidate/${slug}`);

  if (!res.ok) {
    app.innerHTML = "<h2>Candidate not found</h2>";
    return;
  }

  const c = await res.json();

  app.innerHTML = `
    <h1>${c.full_name}</h1>
    <p><strong>Office:</strong> ${c.office}</p>
    <p><strong>State:</strong> ${c.state}</p>
    <p><strong>Party:</strong> ${c.party}</p>
    <p><strong>County:</strong> ${c.county || "N/A"}</p>
    ${c.photo ? `<img src="${c.photo}" width="200" />` : ""}
    <p><a href="/">← Back</a></p>
  `;
}
