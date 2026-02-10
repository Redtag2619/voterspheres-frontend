/* =========================
   CONFIG
========================= */

const API_BASE = "http://localhost:10000";

/* =========================
   LOAD CANDIDATE PROFILE
========================= */

async function loadCandidateProfile() {
  // URL: /candidate/john-smith
  const parts = window.location.pathname.split("/");
  const slug = parts[parts.length - 1];

  if (!slug || slug === "candidate") return;

  try {
    const res = await fetch(`${API_BASE}/api/candidate/${slug}`);
    if (!res.ok) throw new Error("Not found");

    const c = await res.json();

    // SEO
    document.title = `${c.full_name} | Candidate Profile`;
    const meta = document.querySelector("meta[name='description']");
    if (meta) {
      meta.content = `${c.full_name} running for ${c.office} in ${c.state}`;
    }

    // Populate page
    document.getElementById("name").textContent = c.full_name;
    document.getElementById("office").textContent = c.office;
    document.getElementById("party").textContent = c.party;
    document.getElementById("state").textContent = c.state;
    document.getElementById("county").textContent = c.county || "—";

    if (c.photo) {
      const img = document.getElementById("photo");
      img.src = `${API_BASE}${c.photo}`;
      img.alt = c.full_name;
      img.style.display = "block";
    }
  } catch (err) {
    document.body.innerHTML = "<h2>Candidate not found</h2>";
  }
}

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  loadCandidateProfile();
});
