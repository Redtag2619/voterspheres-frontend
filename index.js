const API = "/api";

async function loadCandidates() {
  const res = await fetch(`${API}/candidates`);
  const data = await res.json();

  const container = document.getElementById("results");
  container.innerHTML = "";

  data.forEach(c => {
    const slug =
      c.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" + c.id;

    const div = document.createElement("div");
    div.innerHTML = `
      <a href="/candidate/${slug}">
        ${c.full_name} (${c.state})
      </a>
    `;

    container.appendChild(div);
  });
}

loadCandidates();
