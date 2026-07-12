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

  it("accepts a same-origin browser mutation when Next reconstructs an internal URL", async () => {
    const request = new Request("http://localhost:3102/api/demo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: "127.0.0.1:3102",
        Origin: "http://127.0.0.1:3102",
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify({ type: "reset_demo" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mutateDemoState).toHaveBeenCalledWith({ type: "reset_demo" });
  });

  it("accepts a same-origin mutation behind a trusted forwarding proxy", async () => {
    const request = new Request("http://internal:3000/api/demo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: "internal:3000",
        Origin: "https://demo.gate2tray.example",
        "Sec-Fetch-Site": "same-origin",
        "X-Forwarded-Host": "demo.gate2tray.example",
        "X-Forwarded-Proto": "https",
      },
      body: JSON.stringify({ type: "reset_demo" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
