import { billingApi } from "../services/api";

export async function getBillingConfig() {
  return billingApi.config();
}

export async function getBillingDebug() {
  return billingApi.debugMe();
}

export async function createCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
  trialDays,
}) {
  return billingApi.createCheckoutSession({
    priceId,
    successUrl,
    cancelUrl,
    trialDays,
  });
}

export async function createPortalSession() {
  return billingApi.createPortalSession({});
}
