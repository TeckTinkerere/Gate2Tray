import { beforeEach, describe, expect, it } from "vitest";
import { getDemoState, mutateDemoState } from "@/lib/sqlite";

describe("fleet persistence", () => {
  beforeEach(() => {
    mutateDemoState({ type: "reset_demo" });
  });

  it("round-trips every seeded flight through SQLite", () => {
    const state = getDemoState();

    expect(state.flights).toHaveLength(5);
    expect(new Set(state.flights.map((flight) => flight.id)).size).toBe(5);
  });

  it("persists independent commercial and service lifecycles", () => {
    mutateDemoState({ type: "run_agent", flightId: "MC201" });
    mutateDemoState({ type: "approve_discount", flightId: "MC201" });
    mutateDemoState({ type: "start_service", flightId: "OE105" });
    mutateDemoState({
      type: "place_order",
      flightId: "OE105",
      payload: { itemId: "soba", seat: "12A", serviceWindow: "Main service" },
    });

    const state = getDemoState();
    const target = state.flights.find((flight) => flight.id === "OE105");
    const primary = state.flights.find((flight) => flight.id === "MC201");

    expect(target).toMatchObject({ currentDiscount: 0, serviceStatus: "active" });
    expect(primary).toMatchObject({ currentDiscount: 10, serviceStatus: "not_started" });
    expect(state.discountApprovals.MC201).toBe("approved");
    expect(state.orders.some((order) => order.flightId === "OE105" && order.seat === "12A")).toBe(true);
    expect(state.agentActions.filter((action) => action.flightId === "OE105")).toHaveLength(2);
    expect(state.agentActions.filter((action) => action.flightId === "MC201")).toHaveLength(6);
    expect(state.agentRuns.MC201).toMatchObject({ outcome: "recommendation", status: "completed" });
  });
});
