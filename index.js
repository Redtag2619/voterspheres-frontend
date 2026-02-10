const API_BASE = "";

async function loadCandidateProfile() {
  if (!window.location.pathname.startsWith("/candidate/")) return;

  const slug = window.location.pathname.split("/").pop();

  const res = await fetch(`/api/candidate/${slug}`);

  if (!res.ok) {
    document.body.innerHTML = "<h2>Candidate not found</h2>";
    return;
  }

  const c = await res.json();

  document.title = `${c.full_name} for ${c.office}`;
  document.getElementById("meta-description").content =
    `${c.full_name} is running for ${c.office} in ${c.state}.`;

  document.getElementById("name").textContent = c.full_name;
  document.getElementById("office").textContent = c.office;
  document.getElementById("party").textContent = c.party;
  document.getElementById("state").textContent = c.state;
  document.getElementById("county").textContent = c.county || "—";

  if (c.photo) {
    const img = document.getElementById("photo");
    img.src = `/uploads/${c.photo}`;
    img.style.display = "block";
  }
}

loadCandidateProfile();
