const API = "http://localhost:10000";

async function uploadPhoto() {
  const id = document.getElementById("candidateId").value;
  const file = document.getElementById("photo").files[0];
  const status = document.getElementById("status");

  if (!id || !file) {
    status.innerText = "Candidate ID and photo required";
    return;
  }

  const formData = new FormData();
  formData.append("photo", file);

  try {
    const res = await fetch(`${API}/api/admin/candidate/${id}/photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: formData
    });

    const data = await res.json();
    status.innerText = data.success
      ? "Photo uploaded successfully"
      : data.error;
  } catch {
    status.innerText = "Upload failed";
  }
}
