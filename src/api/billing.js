import api from "../services/api"; 

export async function getBillingConfig() {
  const res = await api.get("/billing/config");
  return res.data;
}

export async function getBillingDebug() {
  const res = await api.get("/billing/debug/me");
  return res.data;
}

export async function createCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
  trialDays,
}) {
  const res = await api.post("/billing/checkout-session", {
    priceId,
    successUrl,
    cancelUrl,
    trialDays,
  });

  return res.data;
}

export async function createPortalSession() {
  const res = await api.post("/billing/portal-session", {});
  return res.data;
}
