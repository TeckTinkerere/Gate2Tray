import { describe, expect, it } from "vitest";
import { recommendDiscount } from "@/lib/agent-tools";
import { executeDemoCommand } from "@/lib/demo-engine";
import { freshDemoState } from "@/lib/mock-data";

describe("bounded CommerceOpsAgent", () => {
  it.each([
    ["MC201", "recommendation", 10, "pending"],
    ["SA418", "no_action", 0, "idle"],
    ["IH307", "exception", 0, "idle"],
    ["OE105", "needs_data", 0, "idle"],
    ["SB660", "safety_hold", 0, "idle"],
  ] as const)(
    "returns the expected decision class for %s",
    (flightId, outcome, discount, approval) => {
      const result = executeDemoCommand(freshDemoState(), {
        type: "run_agent",
        flightId,
      });
      const forecast = result.state.forecasts[flightId] as typeof result.state.forecasts[string] & {
        outcome?: string;
        dataSufficiency?: string;
        algorithmVersion?: string;
      };

      expect(forecast).toMatchObject({
        outcome,
        recommendedDiscount: discount,
        algorithmVersion: "g2t-heuristic-v1",
      });
      expect(result.state.discountApprovals[flightId]).toBe(approval);
      expect(result.state.agentActions.slice(0, 2).every((action) => action.flightId === flightId)).toBe(true);
    },
  );

  it("returns ranges from explicit inputs instead of fabricated confidence", () => {
    const state = freshDemoState();
    const offer = recommendDiscount(state, "MC201") as ReturnType<typeof recommendDiscount> & {
      expectedOrdersRange?: { low: number; high: number } | null;
      projectedSurplusRange?: { low: number; high: number } | null;
    };
    const missingEvidence = recommendDiscount(state, "OE105") as ReturnType<typeof recommendDiscount> & {
      expectedOrdersRange?: { low: number; high: number } | null;
    };

    expect(offer.expectedOrdersRange).toEqual({ low: 23, high: 27 });
    expect(offer.projectedSurplusRange).toEqual({ low: 11, high: 15 });
    expect(offer.confidence).toBeNull();
    expect(missingEvidence.expectedOrders).toBeNull();
    expect(missingEvidence.expectedOrdersRange).toBeNull();
    expect(missingEvidence.confidence).toBeNull();
  });

  it("changes its decision when an authoritative scenario input changes", () => {
    const state = freshDemoState();
    const baseline = recommendDiscount(state, "MC201");
    const changed = freshDemoState();
    const flight = changed.flights.find((entry) => entry.id === "MC201") as typeof changed.flights[number] & {
      operations?: { conversionBaseline: number };
    };
    if (!flight.operations) throw new Error("Missing flight operations fixture.");
    flight.operations.conversionBaseline = 0.75;

    expect(recommendDiscount(changed, "MC201").projectedSurplusUnits).toBeLessThan(
      baseline.projectedSurplusUnits,
    );
  });

  it("refuses to publish when a run did not create a pending recommendation", () => {
    const evaluated = executeDemoCommand(freshDemoState(), {
      type: "run_agent",
      flightId: "SA418",
    });

    expect(() =>
      executeDemoCommand(evaluated.state, {
        type: "approve_discount",
        flightId: "SA418",
      }),
    ).toThrow(/pending offer/i);
  });
});
