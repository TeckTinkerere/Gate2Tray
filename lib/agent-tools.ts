import { discountApprovalSchema } from "@/lib/schemas";
import type { DemoState, MenuItem, Order } from "@/lib/types";

export const OPERATOR_POLICIES = {
  maximumAutomaticDiscount: 15,
  minimumRemainingMargin: 25,
  protectedFinalUnits: 2,
  automaticRefundLimit: 20,
} as const;

export function forecastDemand(state: DemoState, flightId = state.flight.id) {
  const expectedOrders = 40;
  const loadedUnits = state.inventory
    .filter((row) => row.flightId === flightId)
    .reduce((total, row) => total + row.loaded, 0);
  const projectedSurplusUnits = Math.max(0, loadedUnits - expectedOrders);

  return {
    expectedOrders,
    confidence: 86,
    projectedSurplusUnits: Math.max(6, projectedSurplusUnits),
  };
}

export function calculateSurplus(state: DemoState, flightId = state.flight.id) {
  const forecast = forecastDemand(state, flightId);
  const averageCost = state.menuItems.reduce((total, item) => total + item.cost, 0) / state.menuItems.length;
  return {
    units: forecast.projectedSurplusUnits,
    value: forecast.projectedSurplusUnits * averageCost,
  };
}

export function recommendDiscount(state: DemoState, flightId = state.flight.id) {
  const demand = forecastDemand(state, flightId);
  const recommendedDiscount = demand.projectedSurplusUnits >= 6 ? 10 : 0;
  const remainingMargin = 35;
  discountApprovalSchema.parse({ discount: recommendedDiscount, remainingMargin });

  return {
    ...demand,
    recommendedDiscount,
    remainingMargin,
    explanation: `Recommend ${recommendedDiscount}% because ${demand.projectedSurplusUnits} meals are projected to remain unsold. Minimum margin remains above ${OPERATOR_POLICIES.minimumRemainingMargin}%.`,
  };
}

export function findApprovedSubstitutes(state: DemoState, order: Order): MenuItem[] {
  const original = state.menuItems.find((item) => item.id === order.itemId);
  if (!original) return [];

  return state.menuItems.filter((item) => {
    const inventory = state.inventory.find((row) => row.flightId === order.flightId && row.itemId === item.id);
    const hasDietaryMatch = original.dietary.every((label) => item.dietary.includes(label));
    return (
      item.id !== original.id &&
      hasDietaryMatch &&
      inventory !== undefined &&
      !inventory.unavailable &&
      (inventory.loaded - inventory.reserved) > OPERATOR_POLICIES.protectedFinalUnits
    );
  });
}

export function evaluateRefundPolicy(amount: number) {
  return {
    approved: amount < OPERATOR_POLICIES.automaticRefundLimit,
    automatic: amount < OPERATOR_POLICIES.automaticRefundLimit,
    reason:
      amount < OPERATOR_POLICIES.automaticRefundLimit
        ? `Amount is below the S$${OPERATOR_POLICIES.automaticRefundLimit} automatic-refund limit.`
        : "Operator approval is required for refunds of S$20 or more.",
  };
}

export function issueMockRefund(order: Order) {
  const policy = evaluateRefundPolicy(order.amount);
  if (!policy.approved) throw new Error("Operator approval required");
  return {
    reference: `RF-${order.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
    amount: order.amount,
    completedAt: new Date().toISOString(),
  };
}
