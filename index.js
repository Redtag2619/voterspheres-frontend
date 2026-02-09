const API = "http://localhost:10000";

/* ======================== */
/* ROUTER */
/* ======================== */
function router() {
  const path = window.location.pathname;

  if (path.startsWith("/candidate/")) {
    const slug = path.split("/candidate/")[1];
    loadProfile(slug);
  } else {
    loadList();
  }
}

/* ======================== */
/* LIST */
/* ======================== */
async function loadList() {
  const res = await fetch(`${API}/candidates`);
  const data = await res.json();

  document.getElementById("app").innerHTML = `
    <h1>Candidates</h1>
    ${data.results.map(c => `
      <div>
        <a href="/candidate/${c.slug}" data-link>
          <strong>${c.full_name}</strong>
        </a>
        <div>${c.office} – ${c.party}</div>
      </div>
    `).join("")}
  `;

  bindLinks();
}

/* ======================== */
/* PROFILE */
/* ======================== */
async function loadProfile(slug) {
  const res = await fetch(`${API}/candidate/${slug}`);
  if (!res.ok) {
    document.getElementById("app").innerHTML = "Not found";
    return;
  }

  const c = await res.json();

  document.title = `${c.full_name} for ${c.office}`;

  document.getElementById("app").innerHTML = `
    <a href="/" data-link>← Back</a>
    <h1>${c.full_name}</h1>
    ${c.photo ? `<img src="${API}${c.photo}" width="200" />` : ""}
    <p><b>Office:</b> ${c.office}</p>
    <p><b>Party:</b> ${c.party}</p>
    <p><b>State:</b> ${c.state}</p>
  `;

  bindLinks();
}

/* ======================== */
/* NAVIGATION */
/* ======================== */
function bindLinks() {
  document.querySelectorAll("[data-link]").forEach(link => {
    link.onclick = e => {
      e.preventDefault();
      history.pushState(null, "", link.href);
      router();
    };
  });
}

window.onpopstate = router;
router();
