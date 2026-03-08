import { checkHealth } from "./api";

const app = document.querySelector<HTMLDivElement>("#app")!;

async function run() {
  try {
    const health = await checkHealth();

    app.innerHTML = `
      <h1>Frontend Connected 🚀</h1>
      <pre>${JSON.stringify(health, null, 2)}</pre>
    `;
  } catch (err) {
    app.innerHTML = `<h2>Error connecting to backend</h2>`;
    console.error(err);
  }
}

run();
