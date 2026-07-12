# Gate2Tray OS

A demo-first meal-commerce operating system for small charter airlines. The walkthrough connects four surfaces through one local SQLite database:

1. Run the operations agent on `/operator`.
2. Approve the recommended gate discount and scan the flight QR code.
3. Place a meal order on `/order/MC201`.
4. Start service on `/crew/MC201`, mark that meal unavailable, and open the passenger choice.
5. Approve a substitute or complete the simulated refund on `/track/[orderId]`.
6. Return to `/operator` to see the updated audit trail.

## Run locally

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000/operator`. To scan the QR from a physical phone, run `npm run dev -- --hostname 0.0.0.0` and open the operator page using the computer’s LAN address; the QR uses the current browser host.

## Demo architecture

- Next.js App Router, TypeScript, Tailwind CSS, and local shadcn-style components
- SQLite via `better-sqlite3`; the database is created at `data/gate2tray.db`
- Zod validation for commands and checkout input
- Polling every 1.4 seconds for cross-tab and cross-device demo updates
- No authentication and no real payments

## Demo security boundaries

- State-changing requests reject cross-site browser origins.
- Substitute, refund, and delivery commands are revalidated on the server against inventory, dietary, policy, and workflow state.
- The demo still has no identity authentication or role authorization. Run it only with mock data on a trusted local network; do not expose it as a production airline or payment system.

The six requested tables are defined in `database/schema.sql` and initialized automatically by `lib/sqlite.ts`. Resetting the demo reseeds Merlion Charter flight MC201 while retaining the operator policy table.
