import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { executeDemoCommand } from "@/lib/demo-engine";
import { freshDemoState } from "@/lib/mock-data";
import type { AgentAction, DemoCommand, DemoState, DietaryLabel, Flight, FlightInventory, ForecastResult, MenuItem, Order } from "@/lib/types";

const globalForDb = globalThis as unknown as { gate2trayDb?: Database.Database };

function createDatabase() {
  const dataDirectory = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDirectory, { recursive: true });
  const database = new Database(path.join(dataDirectory, "gate2tray.db"));
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = OFF");
  database.exec(`
    CREATE TABLE IF NOT EXISTS flights (
      id TEXT PRIMARY KEY,
      flight_number TEXT NOT NULL,
      airline TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      gate TEXT NOT NULL,
      passengers INTEGER NOT NULL,
      current_discount REAL NOT NULL DEFAULT 0,
      service_status TEXT NOT NULL,
      operations_json TEXT NOT NULL,
      forecast_json TEXT,
      discount_approval TEXT NOT NULL DEFAULT 'idle',
      agent_run_json TEXT
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      dietary_json TEXT NOT NULL,
      symbol TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS flight_inventory (
      flight_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      loaded INTEGER NOT NULL,
      reserved INTEGER NOT NULL,
      unavailable INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (flight_id, item_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      flight_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      original_item_id TEXT,
      seat TEXT NOT NULL,
      section TEXT NOT NULL,
      service_window TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agent_actions (
      id TEXT PRIMARY KEY,
      flight_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS operator_policies (
      key TEXT PRIMARY KEY,
      value REAL NOT NULL,
      description TEXT NOT NULL
    );
  `);
  const actionColumns = database.prepare("PRAGMA table_info(agent_actions)").all() as Array<{ name: string }>;
  if (!actionColumns.some((column) => column.name === "flight_id")) {
    database.exec("ALTER TABLE agent_actions ADD COLUMN flight_id TEXT NOT NULL DEFAULT 'MC201'");
  }
  const flightColumns = database.prepare("PRAGMA table_info(flights)").all() as Array<{ name: string }>;
  if (!flightColumns.some((column) => column.name === "operations_json")) {
    database.exec("ALTER TABLE flights ADD COLUMN operations_json TEXT NOT NULL DEFAULT '{}'");
  }
  if (!flightColumns.some((column) => column.name === "agent_run_json")) {
    database.exec("ALTER TABLE flights ADD COLUMN agent_run_json TEXT");
  }
  seedIfEmpty(database);
  return database;
}

function seedIfEmpty(database: Database.Database) {
  const row = database.prepare("SELECT COUNT(*) AS count FROM flights").get() as { count: number };
  if (row.count === 0) writeState(database, freshDemoState());
  const insertPolicy = database.prepare("INSERT OR REPLACE INTO operator_policies (key, value, description) VALUES (?, ?, ?)");
  insertPolicy.run("maximum_automatic_discount", 15, "Maximum automatic discount percentage");
  insertPolicy.run("minimum_remaining_margin", 25, "Minimum remaining margin percentage");
  insertPolicy.run("protected_final_units", 2, "Final units protected from ordering");
  insertPolicy.run("automatic_refund_limit", 20, "Refunds below this SGD value complete automatically");
}

function db() {
  if (!globalForDb.gate2trayDb) globalForDb.gate2trayDb = createDatabase();
  return globalForDb.gate2trayDb;
}

function readState(database: Database.Database): DemoState {
  const flightRows = database.prepare("SELECT * FROM flights ORDER BY rowid").all() as Record<string, unknown>[];
  const defaultOperations = new Map(freshDemoState().flights.map((flight) => [flight.id, flight.operations]));
  const flights = flightRows.map((flightRow): Flight => ({
    id: String(flightRow.id), flightNumber: String(flightRow.flight_number), airline: String(flightRow.airline), origin: String(flightRow.origin), destination: String(flightRow.destination), departureTime: String(flightRow.departure_time), gate: String(flightRow.gate), passengers: Number(flightRow.passengers), currentDiscount: Number(flightRow.current_discount), serviceStatus: flightRow.service_status as Flight["serviceStatus"], operations: { ...defaultOperations.get(String(flightRow.id))!, ...JSON.parse(String(flightRow.operations_json ?? "{}")) },
  }));
  if (flights.length === 0) throw new Error("Demo database has no flights.");
  const menuItems = (database.prepare("SELECT * FROM menu_items ORDER BY rowid").all() as Record<string, unknown>[]).map((row): MenuItem => ({ id: String(row.id), name: String(row.name), description: String(row.description), price: Number(row.price), cost: Number(row.cost), dietary: JSON.parse(String(row.dietary_json)) as DietaryLabel[], symbol: String(row.symbol) }));
  const inventory = (database.prepare("SELECT * FROM flight_inventory ORDER BY rowid").all() as Record<string, unknown>[]).map((row): FlightInventory => ({ flightId: String(row.flight_id), itemId: String(row.item_id), loaded: Number(row.loaded), reserved: Number(row.reserved), unavailable: Boolean(row.unavailable) }));
  const orders = (database.prepare("SELECT * FROM orders ORDER BY created_at").all() as Record<string, unknown>[]).map((row): Order => ({ id: String(row.id), flightId: String(row.flight_id), itemId: String(row.item_id), originalItemId: row.original_item_id ? String(row.original_item_id) : undefined, seat: String(row.seat), section: row.section as Order["section"], serviceWindow: row.service_window as Order["serviceWindow"], amount: Number(row.amount), status: row.status as Order["status"], createdAt: String(row.created_at), updatedAt: String(row.updated_at) }));
  const agentActions = (database.prepare("SELECT * FROM agent_actions ORDER BY timestamp DESC").all() as Record<string, unknown>[]).map((row): AgentAction => ({ id: String(row.id), flightId: String(row.flight_id), type: row.type as AgentAction["type"], title: String(row.title), detail: String(row.detail), timestamp: String(row.timestamp) }));
  const forecasts = Object.fromEntries(flightRows.map((row) => [
    String(row.id),
    row.forecast_json ? JSON.parse(String(row.forecast_json)) as ForecastResult : null,
  ]));
  const discountApprovals = Object.fromEntries(flightRows.map((row) => [
    String(row.id),
    row.discount_approval as DemoState["discountApprovals"][string],
  ]));
  const agentRuns = Object.fromEntries(flightRows.map((row) => [
    String(row.id),
    row.agent_run_json ? JSON.parse(String(row.agent_run_json)) as DemoState["agentRuns"][string] : null,
  ]));
  return { flights, menuItems, inventory, orders, agentActions, forecasts, discountApprovals, agentRuns };
}

function writeState(database: Database.Database, state: DemoState) {
  database.exec("DELETE FROM flights; DELETE FROM menu_items; DELETE FROM flight_inventory; DELETE FROM orders; DELETE FROM agent_actions;");
  const insertFlight = database.prepare("INSERT INTO flights (id, flight_number, airline, origin, destination, departure_time, gate, passengers, current_discount, service_status, operations_json, forecast_json, discount_approval, agent_run_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  state.flights.forEach((flight) => {
    const forecast = state.forecasts[flight.id] ?? null;
    const discountApproval = state.discountApprovals[flight.id] ?? "idle";
    const agentRun = state.agentRuns[flight.id] ?? null;
    insertFlight.run(flight.id, flight.flightNumber, flight.airline, flight.origin, flight.destination, flight.departureTime, flight.gate, flight.passengers, flight.currentDiscount, flight.serviceStatus, JSON.stringify(flight.operations), forecast ? JSON.stringify(forecast) : null, discountApproval, agentRun ? JSON.stringify(agentRun) : null);
  });
  const insertItem = database.prepare("INSERT INTO menu_items VALUES (?, ?, ?, ?, ?, ?, ?)");
  state.menuItems.forEach((item) => insertItem.run(item.id, item.name, item.description, item.price, item.cost, JSON.stringify(item.dietary), item.symbol));
  const insertInventory = database.prepare("INSERT INTO flight_inventory VALUES (?, ?, ?, ?, ?)");
  state.inventory.forEach((row) => insertInventory.run(row.flightId, row.itemId, row.loaded, row.reserved, row.unavailable ? 1 : 0));
  const insertOrder = database.prepare("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  state.orders.forEach((order) => insertOrder.run(order.id, order.flightId, order.itemId, order.originalItemId ?? null, order.seat, order.section, order.serviceWindow, order.amount, order.status, order.createdAt, order.updatedAt));
  const insertAction = database.prepare("INSERT INTO agent_actions (id, flight_id, type, title, detail, timestamp) VALUES (?, ?, ?, ?, ?, ?)");
  state.agentActions.forEach((entry) => insertAction.run(entry.id, entry.flightId, entry.type, entry.title, entry.detail, entry.timestamp));
}

export function getDemoState() {
  return readState(db());
}

export function mutateDemoState(command: DemoCommand) {
  const database = db();
  return database.transaction(() => {
    const next = executeDemoCommand(readState(database), command);
    writeState(database, next.state);
    return next;
  })();
}
