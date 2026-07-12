import { beforeEach, describe, expect, it, vi } from "vitest";

const { mutateDemoState } = vi.hoisted(() => ({
  mutateDemoState: vi.fn(() => ({ state: {} })),
}));

vi.mock("@/lib/sqlite", () => ({
  getDemoState: vi.fn(() => ({})),
  mutateDemoState,
}));

import { POST } from "@/app/api/demo/route";

describe("POST /api/demo", () => {
  beforeEach(() => {
    mutateDemoState.mockClear();
  });

  it("rejects cross-site mutation requests before executing a command", async () => {
    const request = new Request("http://localhost/api/demo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://attacker.example",
      },
      body: JSON.stringify({ type: "reset_demo" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(mutateDemoState).not.toHaveBeenCalled();
  });
});
