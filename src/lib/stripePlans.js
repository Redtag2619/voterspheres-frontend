export function getPriceIdForPlan(planKey) {
  const plan = String(planKey || "").toLowerCase().trim();

  const priceMap = {
    starter: import.meta.env.VITE_STRIPE_PRICE_STARTER || "starter",
    pro: import.meta.env.VITE_STRIPE_PRICE_PRO || "pro",
    enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || "enterprise",
  };

  return priceMap[plan] || "";
}
