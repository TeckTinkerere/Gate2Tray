# Gate2Tray OS

Gate2Tray is a demo-first operating system for an independent, one-person **Fleet Commerce Operator**. One founder-operator can supervise meal commerce across several fictional carrier clients while a single bounded `CommerceOpsAgent` evaluates evidence, stops when data or safety is insufficient, and waits for the right human before any consequential action.

The walkthrough connects four responsive surfaces through one local SQLite database:

1. Run the operations agent on `/operator`.
2. Approve the recommended gate discount and scan the flight QR code.
3. Place a meal order on `/order/MC201`.
4. Start service on `/crew/MC201`, mark that meal unavailable, and open the passenger choice.
5. Approve a substitute or complete the simulated refund on `/track/[orderId]`.
6. Switch between five flights to see deliberately different agent outcomes and scoped audit trails.

## Synthetic scenario fleet

| Flight | Real-world stress case | Expected bounded outcome |
|---|---|---|
| MC201 | Moderate predeparture surplus | Propose a 10% gate offer and wait for operator approval. |
| SA418 | Near sell-out at protected stock | Take no price action. |
| IH307 | Supplier shortfall with hard dietary constraints | Prioritize passenger-compatible substitution or refund. |
| OE105 | Aircraft change with stale manifest/loading evidence | Request fresh evidence; publish nothing. |
| SB660 | Safety pause during cabin service | Hold commerce and protect reservations until crew resumes. |

All carriers, flights, passengers, orders, payments, and operational signals are synthetic.

## Run locally

```bash
npm install
npm run lint
npm test
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000/operator`. To scan the QR from a physical phone, run `npm run dev -- --hostname 0.0.0.0` and open the operator page using the computer’s LAN address; the QR uses the current browser host.

## Verification

After `npm run build`, start the production server in one terminal with `npm start`. In another terminal run:

```bash
npm run qa:responsive
```

The Playwright QA checks operator, passenger, crew, and tracker routes at 320, 375, 640, 768, 1024, 1280, and 1440 pixels. It also drives offer approval, passenger ordering, crew delivery, tracking, dietary-safe substitution, and safety-pause enforcement while failing on horizontal overflow or browser errors.

## Demo architecture

- Next.js App Router, TypeScript, Tailwind CSS, official ShadCN/Radix primitives, and preserved Gate2Tray design tokens
- SQLite via `better-sqlite3`; the database is created at `data/gate2tray.db`
- Zod validation for commands and checkout input
- One deterministic, bounded agent operating on one versioned flight snapshot per run; no LLM is required
- Every mutation, inventory row, order, approval, run, and audit action carries a `flightId`
- Polling every 1.4 seconds for cross-tab and cross-device demo updates
- No authentication and no real payments

## Demo security boundaries

- State-changing requests reject cross-site browser origins while respecting the public host behind a trusted deployment proxy.
- Substitute, refund, and delivery commands are revalidated on the server against inventory, dietary, policy, and workflow state.
- Price changes require operator approval, substitutions require passenger choice, and service changes remain crew actions.
- The demo still has no identity authentication or role authorization. Run it only with mock data on a trusted local network; do not expose it as a production airline or payment system.

The baseline schema is documented in `database/schema.sql` and evolved automatically by `lib/sqlite.ts`. Resetting the demo restores all five scenarios while retaining the operator policy table. The full CEO/CTO product and delivery contract lives in `docs/superpowers/specs/2026-07-12-gate2tray-opc-platform-design.md`.
