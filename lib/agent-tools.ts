import { discountApprovalSchema } from "@/lib/schemas";
import type { DemoState, ForecastResult, MenuItem, Order } from "@/lib/types";

export const OPERATOR_POLICIES = {
  maximumAutomaticDiscount: 15,
  minimumRemainingMargin: 25,
  protectedFinalUnits: 2,
  automaticRefundLimit: 20,
} as const;

export const DEMAND_ALGORITHM_VERSION = "g2t-heuristic-v1" as const;

function getFlight(state: DemoState, flightId: string) {
  const flight = state.flights.find((entry) => entry.id === flightId);
  if (!flight) throw new Error("Flight not found.");
  return flight;
}

function getFeatureSnapshot(state: DemoState, flightId: string) {
  const flight = getFlight(state, flightId);
  const inventory = state.inventory.filter((row) => row.flightId === flightId);
  return {
    passengers: flight.passengers,
    loadedUnits: inventory.reduce((total, row) => total + row.loaded, 0),
    reservedUnits: inventory.reduce((total, row) => total + row.reserved, 0),
    protectedUnits: inventory.length * OPERATOR_POLICIES.protectedFinalUnits,
    reservationVelocityPerHour: flight.operations.reservationVelocityPerHour,
    conversionBaseline: flight.operations.conversionBaseline,
    minutesToOrderingClose: flight.operations.minutesToOrderingClose,
    dataFreshnessMinutes: flight.operations.dataFreshnessMinutes,
    stateVersion: flight.operations.stateVersion,
  };
}

function calculateRemainingMargin(state: DemoState, discount: number) {
  const averagePrice = state.menuItems.reduce((total, item) => total + item.price, 0) / state.menuItems.length;
  const averageCost = state.menuItems.reduce((total, item) => total + item.cost, 0) / state.menuItems.length;
  const netPrice = averagePrice * (1 - discount / 100);
  return Number((((netPrice - averageCost) / netPrice) * 100).toFixed(1));
}

export function forecastDemand(state: DemoState, flightId: string) {
  const flight = getFlight(state, flightId);
  const featureSnapshot = getFeatureSnapshot(state, flightId);
  const inventory = state.inventory.filter((row) => row.flightId === flightId);

  if (flight.serviceStatus === "paused" || flight.operations.disruption === "safety_pause") {
    return {
      outcome: "safety_hold" as const,
      dataSufficiency: "sufficient" as const,
      expectedOrders: null,
      expectedOrdersRange: null,
      confidence: null,
      projectedSurplusUnits: 0,
      projectedSurplusRange: null,
      featureSnapshot,
    };
  }

  if (!flight.operations.manifestComplete || !flight.operations.loadingConfirmed || flight.operations.dataFreshnessMinutes > 15) {
    return {
      outcome: "needs_data" as const,
      dataSufficiency: "needs_data" as const,
      expectedOrders: null,
      expectedOrdersRange: null,
      confidence: null,
      projectedSurplusUnits: 0,
      projectedSurplusRange: null,
      featureSnapshot,
    };
  }

  if (flight.operations.disruption === "supplier_shortfall" || inventory.some((row) => row.unavailable)) {
    return {
      outcome: "exception" as const,
      dataSufficiency: "sufficient" as const,
      expectedOrders: null,
      expectedOrdersRange: null,
      confidence: null,
      projectedSurplusUnits: 0,
      projectedSurplusRange: null,
      featureSnapshot,
    };
  }

  const remainingHours = Math.min(4, Math.max(0, flight.operations.minutesToOrderingClose) / 60);
  const expectedOrders = Math.max(
    featureSnapshot.reservedUnits,
    Math.round(
      flight.passengers * flight.operations.conversionBaseline
      + flight.operations.reservationVelocityPerHour * remainingHours,
    ),
  );
  const uncertainty = Math.max(2, Math.ceil(expectedOrders * 0.06));
  const expectedOrdersRange = {
    low: Math.max(featureSnapshot.reservedUnits, expectedOrders - uncertainty),
    high: Math.min(featureSnapshot.loadedUnits, expectedOrders + uncertainty),
  };
  const projectedSurplusRange = {
    low: Math.max(0, featureSnapshot.loadedUnits - featureSnapshot.protectedUnits - expectedOrdersRange.high),
    high: Math.max(0, featureSnapshot.loadedUnits - featureSnapshot.protectedUnits - expectedOrdersRange.low),
  };
  const projectedSurplusUnits = Math.max(
    0,
    featureSnapshot.loadedUnits - featureSnapshot.protectedUnits - expectedOrders,
  );

  return {
    outcome: projectedSurplusUnits >= 4 ? "recommendation" as const : "no_action" as const,
    dataSufficiency: "sufficient" as const,
    expectedOrders,
    expectedOrdersRange,
    confidence: null,
    projectedSurplusUnits,
    projectedSurplusRange,
    featureSnapshot,
  };
}

export function calculateSurplus(state: DemoState, flightId: string) {
  const forecast = forecastDemand(state, flightId);
  const averageCost = state.menuItems.reduce((total, item) => total + item.cost, 0) / state.menuItems.length;
  return {
    units: forecast.projectedSurplusUnits,
    value: forecast.projectedSurplusUnits * averageCost,
  };
}

export function recommendDiscount(state: DemoState, flightId: string): ForecastResult {
  const demand = forecastDemand(state, flightId);
  const recommendedDiscount = demand.outcome === "recommendation"
    ? demand.projectedSurplusUnits >= 8 ? 10 : 5
    : 0;
  const remainingMargin = calculateRemainingMargin(state, recommendedDiscount);
  discountApprovalSchema.parse({ discount: recommendedDiscount, remainingMargin });

  const outcomeCopy = {
    recommendation: {
      explanation: `Recommend ${recommendedDiscount}% because expected demand is ${demand.expectedOrdersRange?.low}–${demand.expectedOrdersRange?.high} orders and ${demand.projectedSurplusRange?.low}–${demand.projectedSurplusRange?.high} meals may remain above protected stock.`,
      requiredAction: "Operator approval is required before publishing the offer.",
    },
    no_action: {
      explanation: "No discount recommended because remaining stock is at or below the protected final-unit threshold.",
      requiredAction: "No action. Continue monitoring reservations.",
    },
    needs_data: {
      explanation: "No commercial action: manifest, loading confirmation, or fresh operational evidence is incomplete after the aircraft change.",
      requiredAction: "Confirm the manifest and physical loading, then run a new evaluation.",
    },
    exception: {
      explanation: "Commercial pricing is suspended while a supplier shortfall requires passenger-safe resolution.",
      requiredAction: "Crew must confirm the unavailable item; passengers choose a compatible substitute or refund.",
    },
    safety_hold: {
      explanation: "Commercial automation is on hold because the crew safety pause overrides pricing and fulfillment.",
      requiredAction: "Crew controls service resumption. Reservations remain protected.",
    },
  }[demand.outcome];

  return {
    ...demand,
    algorithmVersion: DEMAND_ALGORITHM_VERSION,
    recommendedDiscount,
    remainingMargin,
    ...outcomeCopy,
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
