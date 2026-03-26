import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://voterspheres-backend.onrender.com/api";

export async function getBillingConfig() {
  const res = await axios.get(`${API_BASE}/billing/config`);
  return res.data;
}

export async function createCheckoutSession({ firm_id, priceId }) {
  const res = await axios.post(`${API_BASE}/billing/checkout-session`, {
    firm_id,
    priceId,
  });
  return res.data;
}

export async function createPortalSession({ firm_id }) {
  const res = await axios.post(`${API_BASE}/billing/portal-session`, {
    firm_id,
  });
  return res.data;
}
