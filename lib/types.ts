export type DietaryLabel = "Halal" | "Vegetarian" | "Vegan" | "Gluten-aware";

export type FlightScenario =
  | "moderate_surplus"
  | "protected_stock"
  | "supplier_shortfall"
  | "aircraft_change"
  | "safety_pause";

export type FlightOperations = {
  scenario: FlightScenario;
  scenarioLabel: string;
  phase: "predeparture" | "boarding" | "in_service" | "completed";
  manifestComplete: boolean;
  loadingConfirmed: boolean;
  stateVersion: number;
  reservationVelocityPerHour: number;
  conversionBaseline: number;
  minutesToOrderingClose: number;
  dataFreshnessMinutes: number;
  disruption: "none" | "supplier_shortfall" | "aircraft_change" | "safety_pause";
};

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
  operations: FlightOperations;
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
  flightId: string;
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
  flightId: string;
  type: "observed" | "recommended" | "approved" | "executed" | "exception";
  title: string;
  detail: string;
  timestamp: string;
};

export type AgentOutcome = "recommendation" | "no_action" | "needs_data" | "exception" | "safety_hold";

export type ForecastResult = {
  outcome: AgentOutcome;
  dataSufficiency: "sufficient" | "needs_data";
  algorithmVersion: "g2t-heuristic-v1";
  expectedOrders: number | null;
  expectedOrdersRange: { low: number; high: number } | null;
  confidence: null;
  projectedSurplusUnits: number;
  projectedSurplusRange: { low: number; high: number } | null;
  recommendedDiscount: number;
  remainingMargin: number;
  explanation: string;
  requiredAction: string;
  featureSnapshot: {
    passengers: number;
    loadedUnits: number;
    reservedUnits: number;
    protectedUnits: number;
    reservationVelocityPerHour: number;
    conversionBaseline: number;
    minutesToOrderingClose: number;
    dataFreshnessMinutes: number;
    stateVersion: number;
  };
};

export type AgentRun = {
  id: string;
  flightId: string;
  outcome: AgentOutcome;
  status: "waiting_for_approval" | "completed";
  algorithmVersion: ForecastResult["algorithmVersion"];
  stateVersion: number;
  toolCalls: Array<"get_flight_context" | "forecast_demand" | "propose_gate_offer">;
  summary: string;
  startedAt: string;
  completedAt: string;
};

export type DemoState = {
  flights: Flight[];
  menuItems: MenuItem[];
  inventory: FlightInventory[];
  orders: Order[];
  agentActions: AgentAction[];
  forecasts: Record<string, ForecastResult | null>;
  discountApprovals: Record<string, "idle" | "pending" | "approved">;
  agentRuns: Record<string, AgentRun | null>;
};

export type DemoCommand =
  | { type: "run_agent"; flightId: string }
  | { type: "approve_discount"; flightId: string }
  | { type: "place_order"; flightId: string; payload: { itemId: string; seat: string; serviceWindow: ServiceWindow } }
  | { type: "start_service"; flightId: string }
  | { type: "pause_service"; flightId: string }
  | { type: "mark_item_unavailable"; flightId: string; payload: { itemId: string } }
  | { type: "mark_order_delivered"; flightId: string; payload: { orderId: string } }
  | { type: "choose_substitute"; flightId: string; payload: { orderId: string; itemId: string } }
  | { type: "refund_order"; flightId: string; payload: { orderId: string } }
  | { type: "reset_demo" };
