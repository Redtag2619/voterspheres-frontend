const API = "http://localhost:10000/api";

/* ============================
   LOAD CANDIDATES
============================ */

async function loadCandidates() {
  const res = await fetch(`${API}/candidates`);
  const data = await res.json();

  const container = document.getElementById("results");
  container.innerHTML = "";

  data.forEach(c => {
    // 🔑 SEO SLUG (THIS IS STEP 4)
    const slug =
      c.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" + c.id;

    const div = document.createElement("div");
    div.className = "candidate";

    div.innerHTML = `
      <a href="candidate.html?slug=${slug}">
        ${c.full_name}
      </a>
    `;

    container.appendChild(div);
  });
}

loadCandidates();
