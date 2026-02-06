const API_BASE = "http://localhost:10000";

async function loadCandidates() {
  try {
    const res = await fetch(`${API_BASE}/api/candidates`);
    const data = await res.json();

    const list = document.getElementById("results");
    list.innerHTML = "";

    data.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c.name;
      list.appendChild(li);
    });

  } catch (err) {
    console.error("Frontend error:", err);
  }
}
async function uploadPhoto(){
  const id=document.getElementById("candidateId").value;
  const file=document.getElementById("photo").files[0];
  const status=document.getElementById("uploadStatus");

  if(!id || !file){
    status.innerText="Missing candidate ID or file";
    return;
  }

  const form=new FormData();
  form.append("photo",file);

  const res=await fetch(
    `http://localhost:10000/api/admin/candidate/${id}/photo`,
    {
      method:"POST",
      headers:{
        Authorization:`Bearer ${localStorage.getItem("token")}`
      },
      body:form
    }
  );

  const data=await res.json();
  status.innerText=data.success ? "Upload successful" : data.error;
}

async function loadStates() {
  try {
    const res = await fetch(`${API_BASE}/api/dropdowns/states`);
    const data = await res.json();

    const select = document.getElementById("stateSelect");
    select.innerHTML = `<option value="">All States</option>`;

    data.forEach(row => {
      const opt = document.createElement("option");
      opt.value = row.state;
      opt.textContent = row.state;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCandidates();
  loadStates();
});
