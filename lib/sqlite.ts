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
      forecast_json TEXT,
      discount_approval TEXT NOT NULL DEFAULT 'idle'
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
  const flightRow = database.prepare("SELECT * FROM flights LIMIT 1").get() as Record<string, unknown>;
  const flight: Flight = {
    id: String(flightRow.id), flightNumber: String(flightRow.flight_number), airline: String(flightRow.airline), origin: String(flightRow.origin), destination: String(flightRow.destination), departureTime: String(flightRow.departure_time), gate: String(flightRow.gate), passengers: Number(flightRow.passengers), currentDiscount: Number(flightRow.current_discount), serviceStatus: flightRow.service_status as Flight["serviceStatus"],
  };
  const menuItems = (database.prepare("SELECT * FROM menu_items ORDER BY rowid").all() as Record<string, unknown>[]).map((row): MenuItem => ({ id: String(row.id), name: String(row.name), description: String(row.description), price: Number(row.price), cost: Number(row.cost), dietary: JSON.parse(String(row.dietary_json)) as DietaryLabel[], symbol: String(row.symbol) }));
  const inventory = (database.prepare("SELECT * FROM flight_inventory ORDER BY rowid").all() as Record<string, unknown>[]).map((row): FlightInventory => ({ itemId: String(row.item_id), loaded: Number(row.loaded), reserved: Number(row.reserved), unavailable: Boolean(row.unavailable) }));
  const orders = (database.prepare("SELECT * FROM orders ORDER BY created_at").all() as Record<string, unknown>[]).map((row): Order => ({ id: String(row.id), flightId: String(row.flight_id), itemId: String(row.item_id), originalItemId: row.original_item_id ? String(row.original_item_id) : undefined, seat: String(row.seat), section: row.section as Order["section"], serviceWindow: row.service_window as Order["serviceWindow"], amount: Number(row.amount), status: row.status as Order["status"], createdAt: String(row.created_at), updatedAt: String(row.updated_at) }));
  const agentActions = (database.prepare("SELECT * FROM agent_actions ORDER BY timestamp DESC").all() as Record<string, unknown>[]).map((row): AgentAction => ({ id: String(row.id), type: row.type as AgentAction["type"], title: String(row.title), detail: String(row.detail), timestamp: String(row.timestamp) }));
  return { flight, menuItems, inventory, orders, agentActions, forecast: flightRow.forecast_json ? JSON.parse(String(flightRow.forecast_json)) as ForecastResult : null, discountApproval: flightRow.discount_approval as DemoState["discountApproval"] };
}

function writeState(database: Database.Database, state: DemoState) {
  database.exec("DELETE FROM flights; DELETE FROM menu_items; DELETE FROM flight_inventory; DELETE FROM orders; DELETE FROM agent_actions;");
  database.prepare("INSERT INTO flights VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(state.flight.id, state.flight.flightNumber, state.flight.airline, state.flight.origin, state.flight.destination, state.flight.departureTime, state.flight.gate, state.flight.passengers, state.flight.currentDiscount, state.flight.serviceStatus, state.forecast ? JSON.stringify(state.forecast) : null, state.discountApproval);
  const insertItem = database.prepare("INSERT INTO menu_items VALUES (?, ?, ?, ?, ?, ?, ?)");
  state.menuItems.forEach((item) => insertItem.run(item.id, item.name, item.description, item.price, item.cost, JSON.stringify(item.dietary), item.symbol));
  const insertInventory = database.prepare("INSERT INTO flight_inventory VALUES (?, ?, ?, ?, ?)");
  state.inventory.forEach((row) => insertInventory.run(state.flight.id, row.itemId, row.loaded, row.reserved, row.unavailable ? 1 : 0));
  const insertOrder = database.prepare("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  state.orders.forEach((order) => insertOrder.run(order.id, order.flightId, order.itemId, order.originalItemId ?? null, order.seat, order.section, order.serviceWindow, order.amount, order.status, order.createdAt, order.updatedAt));
  const insertAction = database.prepare("INSERT INTO agent_actions VALUES (?, ?, ?, ?, ?)");
  state.agentActions.forEach((entry) => insertAction.run(entry.id, entry.type, entry.title, entry.detail, entry.timestamp));
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
