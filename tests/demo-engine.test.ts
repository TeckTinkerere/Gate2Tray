import { describe, expect, it } from "vitest";
import { executeDemoCommand } from "@/lib/demo-engine";
import { freshDemoState } from "@/lib/mock-data";

function stateWithPassengerChoice() {
  const state = freshDemoState();
  const order = state.orders[0];

  return {
    ...state,
    inventory: state.inventory.map((row) =>
      row.flightId === order.flightId && row.itemId === order.itemId ? { ...row, unavailable: true } : row,
    ),
    orders: state.orders.map((entry) =>
      entry.id === order.id ? { ...entry, status: "action_required" as const } : entry,
    ),
  };
}

describe("executeDemoCommand", () => {
  it("rejects a dietary-incompatible substitute even when called directly", () => {
    const state = stateWithPassengerChoice();
    const order = state.orders[0];

    expect(() =>
      executeDemoCommand(state, {
        type: "choose_substitute",
        flightId: order.flightId,
        payload: { orderId: order.id, itemId: "salmon" },
      }),
    ).toThrow(/dietary/i);
  });

  it("rejects a refund unless the order is awaiting passenger resolution", () => {
    const state = freshDemoState();
    const order = state.orders[0];

    expect(() =>
      executeDemoCommand(state, {
        type: "refund_order",
        flightId: order.flightId,
        payload: { orderId: order.id },
      }),
    ).toThrow(/resolution/i);
  });

  it("rejects delivery while cabin service is not active", () => {
    const state = freshDemoState();
    const order = state.orders[0];

    expect(() =>
      executeDemoCommand(state, {
        type: "mark_order_delivered",
        flightId: order.flightId,
        payload: { orderId: order.id },
      }),
    ).toThrow(/active/i);
  });

  it("rejects delivery for a refunded order", () => {
    const state = freshDemoState();
    const order = state.orders[0];
    state.flight.serviceStatus = "active";
    state.flights = state.flights.map((flight) =>
      flight.id === order.flightId ? { ...flight, serviceStatus: "active" } : flight,
    );
    order.status = "refunded";

    expect(() =>
      executeDemoCommand(state, {
        type: "mark_order_delivered",
        flightId: order.flightId,
        payload: { orderId: order.id },
      }),
    ).toThrow(/deliverable/i);
  });
});
