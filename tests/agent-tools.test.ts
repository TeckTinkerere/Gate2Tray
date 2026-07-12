import { describe, expect, it } from "vitest";
import { findApprovedSubstitutes } from "@/lib/agent-tools";
import { freshDemoState } from "@/lib/mock-data";

describe("findApprovedSubstitutes", () => {
  it("requires every dietary label from the original meal", () => {
    const state = freshDemoState();
    const order = state.orders[0];
    const original = state.menuItems.find((item) => item.id === order.itemId);

    expect(original).toBeDefined();

    const substitutes = findApprovedSubstitutes(state, order);

    expect(
      substitutes.every((candidate) =>
        original!.dietary.every((label) => candidate.dietary.includes(label)),
      ),
    ).toBe(true);
  });
});
