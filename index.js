const API = "http://localhost:10000";

let currentPage = 1;
async function uploadPhoto() {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    return;
  }

  const file = document.getElementById("photoFile").files[0];

  if (!file) {
    alert("Select an image");
    return;
  }

  const candidateId = prompt("Enter Candidate ID:");

  if (!candidateId) return;

  const form = new FormData();
  form.append("photo", file);

  try {

    const res = await fetch(
      `http://localhost:10000/api/candidates/${candidateId}/photo`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        },
        body: form
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Upload failed");
      return;
    }

    alert("Photo uploaded successfully!");

  } catch (err) {
    alert("Upload error");
  }
}

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
