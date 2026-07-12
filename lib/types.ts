export type DietaryLabel = "Halal" | "Vegetarian" | "Vegan" | "Gluten-aware";

export type Flight = {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  gate: string;
  passengers: number;
  currentDiscount: number;
  serviceStatus: "not_started" | "active" | "paused" | "complete";
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  dietary: DietaryLabel[];
  symbol: string;
};

export type FlightInventory = {
  itemId: string;
  loaded: number;
  reserved: number;
  unavailable: boolean;
};

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "delivered"
  | "action_required"
  | "substituted"
  | "refunded";

export type ServiceWindow = "Main service" | "After take-off";

export type Order = {
  id: string;
  flightId: string;
  itemId: string;
  originalItemId?: string;
  seat: string;
  section: "Forward cabin" | "Mid cabin" | "Aft cabin";
  serviceWindow: ServiceWindow;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type AgentAction = {
  id: string;
  type: "observed" | "recommended" | "approved" | "executed" | "exception";
  title: string;
  detail: string;
  timestamp: string;
};

export type ForecastResult = {
  expectedOrders: number;
  confidence: number;
  projectedSurplusUnits: number;
  recommendedDiscount: number;
  remainingMargin: number;
  explanation: string;
};

export type DemoState = {
  flight: Flight;
  menuItems: MenuItem[];
  inventory: FlightInventory[];
  orders: Order[];
  agentActions: AgentAction[];
  forecast: ForecastResult | null;
  discountApproval: "idle" | "pending" | "approved";
};

export type DemoCommand =
  | { type: "run_agent" }
  | { type: "approve_discount" }
  | { type: "place_order"; payload: { itemId: string; seat: string; serviceWindow: ServiceWindow } }
  | { type: "start_service" }
  | { type: "pause_service" }
  | { type: "mark_item_unavailable"; payload: { itemId: string } }
  | { type: "mark_order_delivered"; payload: { orderId: string } }
  | { type: "choose_substitute"; payload: { orderId: string; itemId: string } }
  | { type: "refund_order"; payload: { orderId: string } }
  | { type: "reset_demo" };
