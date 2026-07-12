import type { DemoState } from "@/lib/types";

const now = new Date("2026-07-12T12:56:00+08:00").getTime();

export const initialDemoState: DemoState = {
  flight: {
    id: "MC201",
    flightNumber: "MC201",
    airline: "Merlion Charter",
    origin: "Singapore",
    destination: "Langkawi",
    departureTime: "2026-07-12T14:20:00+08:00",
    gate: "D42",
    passengers: 48,
    currentDiscount: 0,
    serviceStatus: "not_started",
  },
  menuItems: [
    {
      id: "lemak",
      name: "Coconut Chicken Nasi Lemak",
      description: "Fragrant rice, sambal, cucumber and spiced chicken.",
      price: 14,
      cost: 7.4,
      dietary: ["Halal", "Gluten-aware"],
      symbol: "NL",
    },
    {
      id: "soba",
      name: "Sesame Garden Soba",
      description: "Chilled buckwheat noodles, greens and sesame dressing.",
      price: 12,
      cost: 5.8,
      dietary: ["Vegetarian"],
      symbol: "SO",
    },
    {
      id: "curry",
      name: "Plant-Based Rendang Curry",
      description: "Mushroom rendang, turmeric rice and pickled vegetables.",
      price: 13,
      cost: 6.4,
      dietary: ["Vegan", "Halal", "Gluten-aware"],
      symbol: "RC",
    },
    {
      id: "salmon",
      name: "Miso Salmon Rice Bowl",
      description: "Miso-glazed salmon, edamame and steamed rice.",
      price: 16,
      cost: 8.2,
      dietary: ["Gluten-aware"],
      symbol: "MS",
    },
  ],
  inventory: [
    { itemId: "lemak", loaded: 14, reserved: 5, unavailable: false },
    { itemId: "soba", loaded: 12, reserved: 2, unavailable: false },
    { itemId: "curry", loaded: 11, reserved: 3, unavailable: false },
    { itemId: "salmon", loaded: 9, reserved: 1, unavailable: false },
  ],
  orders: [
    {
      id: "G2T-8201",
      flightId: "MC201",
      itemId: "lemak",
      seat: "3C",
      section: "Forward cabin",
      serviceWindow: "Main service",
      amount: 14,
      status: "confirmed",
      createdAt: new Date(now - 18 * 60_000).toISOString(),
      updatedAt: new Date(now - 18 * 60_000).toISOString(),
    },
    {
      id: "G2T-8202",
      flightId: "MC201",
      itemId: "soba",
      seat: "8A",
      section: "Forward cabin",
      serviceWindow: "After take-off",
      amount: 12,
      status: "confirmed",
      createdAt: new Date(now - 12 * 60_000).toISOString(),
      updatedAt: new Date(now - 12 * 60_000).toISOString(),
    },
    {
      id: "G2T-8203",
      flightId: "MC201",
      itemId: "curry",
      seat: "14F",
      section: "Mid cabin",
      serviceWindow: "Main service",
      amount: 13,
      status: "confirmed",
      createdAt: new Date(now - 7 * 60_000).toISOString(),
      updatedAt: new Date(now - 7 * 60_000).toISOString(),
    },
  ],
  agentActions: [
    {
      id: "action-seed-1",
      type: "observed",
      title: "Inventory synchronized",
      detail: "46 meals loaded across four menu items. Crew count verified at gate D42.",
      timestamp: new Date(now - 35 * 60_000).toISOString(),
    },
    {
      id: "action-seed-2",
      type: "executed",
      title: "Passenger menu published",
      detail: "Flight-specific ordering page is live for MC201.",
      timestamp: new Date(now - 28 * 60_000).toISOString(),
    },
  ],
  forecast: null,
  discountApproval: "idle",
};

export function freshDemoState(): DemoState {
  return JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
}
