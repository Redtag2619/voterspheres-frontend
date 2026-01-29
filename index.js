const backendURL = "https://voterspheres-backend.onrender.com";

async function checkBackend() {
  try {
    const res = await fetch(`${backendURL}/health`);
    const data = await res.json();

    document.getElementById("status").innerText =
      `Backend Status: ${data.status} | DB: ${data.database}`;
  } catch (err) {
    document.getElementById("status").innerText =
      "❌ Backend unreachable";
  }
}

async function loadVoters() {
  const res = await fetch(`${backendURL}/api/voters`);
  const voters = await res.json();

  const list = document.createElement("ul");

  voters.forEach(v => {
    const li = document.createElement("li");
    li.innerText = v.name || JSON.stringify(v);
    list.appendChild(li);
  });

  document.body.appendChild(list);
}

checkBackend();
loadVoters();
