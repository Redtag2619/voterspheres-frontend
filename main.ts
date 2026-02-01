import "./style.css";
import { apiGet } from "./api";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <h1>VoterSpheres</h1>
  <button id="loadBtn">Load Voters</button>
  <pre id="output"></pre>
`;

const btn = document.getElementById("loadBtn")!;
const output = document.getElementById("output")!;

btn.addEventListener("click", async () => {
  output.textContent = "Loading...";

  try {
    const data = await apiGet("/api/voters");
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = "Error loading voters";
  }
});
