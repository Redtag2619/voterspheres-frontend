const API = "http://localhost:10000";
let page = 1;

/* ===================== */
/* LIST PAGE */
/* ===================== */
async function loadCandidates() {
  const res = await fetch(`${API}/candidates?page=${page}`);
  const data = await res.json();

  const container = document.getElementById("candidates");
  container.innerHTML = "";

  data.results.forEach(c => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>
        <a href="/profile.html?slug=${c.slug}">
          ${c.full_name}
        </a>
      </h3>
      <p>${c.office} – ${c.party}</p>
    `;
    container.appendChild(div);
  });

  document.getElementById("page").innerText =
    `Page ${data.page} of ${Math.ceil(data.total / 20)}`;
}

/* Pagination */
document.getElementById("prev")?.addEventListener("click", () => {
  if (page > 1) { page--; loadCandidates(); }
});
document.getElementById("next")?.addEventListener("click", () => {
  page++; loadCandidates();
});

/* ===================== */
/* PROFILE PAGE + SEO */
/* ===================== */
async function loadProfile() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) return;

  const res = await fetch(`${API}/candidate/${slug}`);
  const c = await res.json();

  document.getElementById("name").innerText = c.full_name;
  document.getElementById("office").innerText = c.office;
  document.getElementById("state").innerText = c.state;
  document.getElementById("party").innerText = c.party;
  document.getElementById("county").innerText = c.county || "";

  /* IMAGE */
  if (c.photo) {
    const img = document.getElementById("photo");
    img.src = `${API}${c.photo}`;
    img.style.display = "block";
  }

  /* SEO */
  document.title = `${c.full_name} for ${c.office} | VoterSpheres`;

  const description =
    `${c.full_name} is a ${c.party} candidate for ${c.office} in ${c.state}.`;

  document
    .getElementById("seo-description")
    .setAttribute("content", description);

  document
    .getElementById("canonical")
    .setAttribute("href", `https://voterspheres.com/candidate/${c.slug}`);

  document
    .getElementById("og-title")
    .setAttribute("content", document.title);

  document
    .getElementById("og-description")
    .setAttribute("content", description);

  /* JSON-LD */
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": c.full_name,
    "jobTitle": c.office,
    "affiliation": c.party,
    "address": {
      "@type": "AdministrativeArea",
      "name": c.state
    },
    "url": `https://voterspheres.com/candidate/${c.slug}`
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);

  window.candidateId = c.id;
}

/* ===================== */
/* ADMIN UPLOAD */
/* ===================== */
async function uploadPhoto() {
  const file = document.getElementById("photoInput").files[0];
  if (!file) return alert("Select a file");

  const token = localStorage.getItem("token");
  if (!token) return alert("Admin login required");

  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(
    `${API}/admin/candidate/${window.candidateId}/photo`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    }
  );

  if (!res.ok) return alert("Upload failed");
  alert("Photo uploaded");
  location.reload();
}

/* INIT */
if (document.getElementById("candidates")) loadCandidates();
if (window.location.pathname.includes("profile.html")) loadProfile();
