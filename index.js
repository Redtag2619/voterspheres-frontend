const API = "http://localhost:10000";
const ADMIN_ID = 1; // replace with logged-in admin ID

async function loadCandidates() {
  const res = await fetch(`${API}/api/candidates`);
  const data = await res.json();

  const select = document.getElementById("candidateSelect");
  const list = document.getElementById("candidateList");

  select.innerHTML = "";
  list.innerHTML = "";

  data.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.full_name;
    select.appendChild(opt);

    const div = document.createElement("div");
    div.innerHTML = `
      <h4>${c.full_name}</h4>
      ${c.photo ? `<img src="${API}${c.photo}" width="120"/>` : "No photo"}
    `;
    list.appendChild(div);
  });
}

async function uploadPhoto() {
  const candidateId = document.getElementById("candidateSelect").value;
  const file = document.getElementById("photoInput").files[0];

  if (!file) return alert("Select a file");

  const form = new FormData();
  form.append("photo", file);

  const res = await fetch(
    `${API}/api/admin/candidates/${candidateId}/photo`,
    {
      method: "POST",
      headers: { "x-user-id": ADMIN_ID },
      body: form
    }
  );

  const data = await res.json();
  if (data.success) {
    alert("Upload successful");
    loadCandidates();
  } else {
    alert("Upload failed");
  }
}

loadCandidates();
