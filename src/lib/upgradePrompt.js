const STORAGE_KEY = "vs_upgrade_prompt";

function normalizePlan(plan = "pro") {
  return String(plan || "pro").toLowerCase();
}

function safeJson(value) {
  try {
    return JSON.stringify(value || {});
  } catch {
    return "{}";
  }
}

function buildPricingUrl({ requiredPlan = "pro", source = "", message = "" } = {}) {
  const params = new URLSearchParams();

  params.set("upgrade", normalizePlan(requiredPlan));

  if (source) params.set("source", source);
  if (message) params.set("message", message);

  return `/pricing?${params.toString()}`;
}

function removeExistingModal() {
  const existing = document.getElementById("vs-upgrade-modal-root");
  if (existing) existing.remove();
}

function saveUpgradePrompt(payload = {}) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      safeJson({
        ...payload,
        created_at: new Date().toISOString()
      })
    );
  } catch {
    // ignore
  }
}

export function getLastUpgradePrompt() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearUpgradePrompt() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function triggerUpgradePrompt(payload = {}) {
  const requiredPlan = normalizePlan(payload.requiredPlan || "pro");
  const currentPlan = normalizePlan(payload.currentPlan || "starter");
  const source = String(payload.source || "").trim();
  const message =
    payload.message ||
    `This feature requires the ${requiredPlan.toUpperCase()} plan.`;

  const upgradePayload = {
    requiredPlan,
    currentPlan,
    source,
    message
  };

  saveUpgradePrompt(upgradePayload);

  if (typeof window === "undefined" || typeof document === "undefined") {
    return upgradePayload;
  }

  window.dispatchEvent(
    new CustomEvent("voterspheres:upgrade-required", {
      detail: upgradePayload
    })
  );

  removeExistingModal();

  const root = document.createElement("div");
  root.id = "vs-upgrade-modal-root";

  root.innerHTML = `
    <div class="vs-upgrade-backdrop">
      <div class="vs-upgrade-card">
        <div class="vs-upgrade-eyebrow">Upgrade Required</div>
        <h2 class="vs-upgrade-title">Unlock ${requiredPlan.toUpperCase()}</h2>
        <p class="vs-upgrade-message">${message}</p>

        <div class="vs-upgrade-details">
          <div>
            <span>Current Plan</span>
            <strong>${currentPlan.toUpperCase()}</strong>
          </div>
          <div>
            <span>Required Plan</span>
            <strong>${requiredPlan.toUpperCase()}</strong>
          </div>
        </div>

        <div class="vs-upgrade-actions">
          <button type="button" class="vs-upgrade-secondary" data-vs-upgrade-dismiss>
            Not now
          </button>
          <button type="button" class="vs-upgrade-primary" data-vs-upgrade-open>
            View pricing
          </button>
        </div>
      </div>
    </div>

    <style>
      .vs-upgrade-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(2, 6, 23, 0.74);
        backdrop-filter: blur(10px);
      }

      .vs-upgrade-card {
        width: min(520px, 100%);
        border-radius: 24px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background:
          radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 38%),
          linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.94));
        box-shadow: 0 34px 90px rgba(2, 6, 23, 0.55);
        padding: 26px;
        color: rgba(248, 250, 252, 0.96);
      }

      .vs-upgrade-eyebrow {
        color: rgba(96, 165, 250, 0.96);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .vs-upgrade-title {
        margin: 8px 0 0;
        font-size: 1.65rem;
        line-height: 1.15;
      }

      .vs-upgrade-message {
        margin: 10px 0 0;
        color: rgba(203, 213, 225, 0.9);
        line-height: 1.55;
      }

      .vs-upgrade-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 20px;
      }

      .vs-upgrade-details div {
        border: 1px solid rgba(148, 163, 184, 0.16);
        background: rgba(15, 23, 42, 0.52);
        border-radius: 16px;
        padding: 13px;
      }

      .vs-upgrade-details span {
        display: block;
        color: rgba(148, 163, 184, 0.88);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .vs-upgrade-details strong {
        display: block;
        margin-top: 6px;
        font-size: 1rem;
      }

      .vs-upgrade-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 22px;
      }

      .vs-upgrade-primary,
      .vs-upgrade-secondary {
        border-radius: 999px;
        padding: 10px 15px;
        font-weight: 900;
        cursor: pointer;
      }

      .vs-upgrade-primary {
        border: 1px solid rgba(96, 165, 250, 0.42);
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
      }

      .vs-upgrade-secondary {
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.72);
        color: rgba(248, 250, 252, 0.9);
      }

      @media (max-width: 520px) {
        .vs-upgrade-details {
          grid-template-columns: 1fr;
        }

        .vs-upgrade-actions {
          flex-direction: column-reverse;
        }

        .vs-upgrade-primary,
        .vs-upgrade-secondary {
          width: 100%;
        }
      }
    </style>
  `;

  document.body.appendChild(root);

  const dismissButton = root.querySelector("[data-vs-upgrade-dismiss]");
  const openButton = root.querySelector("[data-vs-upgrade-open]");

  dismissButton?.addEventListener("click", () => {
    removeExistingModal();
  });

  openButton?.addEventListener("click", () => {
    const url = buildPricingUrl({
      requiredPlan,
      source,
      message
    });

    removeExistingModal();
    window.location.href = url;
  });

  return upgradePayload;
}

export default triggerUpgradePrompt;
