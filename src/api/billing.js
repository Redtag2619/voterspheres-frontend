import axios from "axios";
import { getAuthHeader } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")}/api`
    : "https://voterspheres-backend.onrender.com/api");

export async function getBillingConfig() {
  const res = await axios.get(`${API_BASE}/billing/config`);
  return res.data;
}

export async function getBillingDebug() {
  const res = await axios.get(`${API_BASE}/billing/debug/me`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  return res.data;
}

export async function createCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
  trialDays,
}) {
  const res = await axios.post(
    `${API_BASE}/billing/checkout-session`,
    {
      priceId,
      successUrl,
      cancelUrl,
      trialDays,
    },
    {
      headers: {
        ...getAuthHeader(),
      },
    }
  );

  return res.data;
}

export async function createPortalSession() {
  const res = await axios.post(
    `${API_BASE}/billing/portal-session`,
    {},
    {
      headers: {
        ...getAuthHeader(),
      },
    }
  );

  return res.data;
}
