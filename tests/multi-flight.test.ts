import { describe, expect, it } from "vitest";
import { executeDemoCommand } from "@/lib/demo-engine";
import { freshDemoState } from "@/lib/mock-data";
import type { DemoCommand } from "@/lib/types";

describe("fleet scenario fixtures", () => {
  it("seeds at least five distinct flights", () => {
    const state = freshDemoState() as unknown as {
      flights?: Array<{ id: string }>;
    };

    expect(state.flights).toBeDefined();
    expect(state.flights?.length).toBeGreaterThanOrEqual(5);
    expect(new Set(state.flights?.map((flight) => flight.id)).size).toBe(
      state.flights?.length,
    );
  });

  it("provides an isolated inventory fixture for every flight", () => {
    const state = freshDemoState() as unknown as {
      flights: Array<{ id: string }>;
      menuItems: Array<{ id: string }>;
      inventory: Array<{ flightId?: string; itemId: string }>;
    };

    for (const flight of state.flights) {
      const itemIds = state.inventory
        .filter((row) => row.flightId === flight.id)
        .map((row) => row.itemId);

      expect(itemIds).toHaveLength(state.menuItems.length);
      expect(new Set(itemIds).size).toBe(state.menuItems.length);
    }
  });

  it("runs an agent evaluation for only the requested flight", () => {
    const state = freshDemoState();
    const result = executeDemoCommand(state, {
      type: "run_agent",
      flightId: "SA418",
    } as DemoCommand) as {
      state: {
        forecasts?: Record<string, unknown>;
      };
    };

    expect(result.state.forecasts?.SA418).toBeDefined();
    expect(result.state.forecasts?.MC201).toBeNull();
  });

  it("places an order against only the requested flight inventory", () => {
    const state = freshDemoState();
    const targetBefore = state.inventory.find(
      (row) => row.flightId === "OE105" && row.itemId === "soba",
    )!;
    const primaryBefore = state.inventory.find(
      (row) => row.flightId === "MC201" && row.itemId === "soba",
    )!;

    const result = executeDemoCommand(state, {
      type: "place_order",
      flightId: "OE105",
      payload: { itemId: "soba", seat: "12A", serviceWindow: "Main service" },
    } as DemoCommand);

    expect(result.state.orders.at(-1)?.flightId).toBe("OE105");
    expect(
      result.state.inventory.find(
        (row) => row.flightId === "OE105" && row.itemId === "soba",
      )?.reserved,
    ).toBe(targetBefore.reserved + 1);
    expect(
      result.state.inventory.find(
        (row) => row.flightId === "MC201" && row.itemId === "soba",
      )?.reserved,
    ).toBe(primaryBefore.reserved);
  });

  it("changes service status for only the requested flight", () => {
    const state = freshDemoState();
    const result = executeDemoCommand(state, {
      type: "start_service",
      flightId: "IH307",
    } as DemoCommand);

    expect(result.state.flights.find((flight) => flight.id === "IH307")?.serviceStatus).toBe("active");
    expect(result.state.flights.find((flight) => flight.id === "MC201")?.serviceStatus).toBe("not_started");
  });

  it("marks inventory unavailable for only the requested flight", () => {
    const state = freshDemoState();
    const result = executeDemoCommand(state, {
      type: "mark_item_unavailable",
      flightId: "OE105",
      payload: { itemId: "soba" },
    } as DemoCommand);

    expect(
      result.state.inventory.find(
        (row) => row.flightId === "OE105" && row.itemId === "soba",
      )?.unavailable,
    ).toBe(true);
    expect(
      result.state.inventory.find(
        (row) => row.flightId === "MC201" && row.itemId === "soba",
      )?.unavailable,
    ).toBe(false);
  });

  it("publishes an approved discount for only the requested flight", () => {
    const state = freshDemoState();
    const evaluated = executeDemoCommand(state, {
      type: "run_agent",
      flightId: "OE105",
    });
    const approved = executeDemoCommand(evaluated.state, {
      type: "approve_discount",
      flightId: "OE105",
    } as DemoCommand);

    expect(approved.state.flights.find((flight) => flight.id === "OE105")?.currentDiscount).toBe(10);
    expect(approved.state.flights.find((flight) => flight.id === "MC201")?.currentDiscount).toBe(0);
    expect(approved.state.discountApprovals?.OE105).toBe("approved");
  });
});
