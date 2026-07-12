PRAGMA journal_mode = WAL;

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
