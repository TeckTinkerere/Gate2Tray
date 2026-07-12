# Gate2Tray Fleet Commerce OS — Product and Technical Design

**Status:** Approved product direction; implementation specification

**Date:** 2026-07-12

**Canonical operator:** Independent one-person Fleet Commerce Operator

**Delivery model:** PRD-first, test-first, stage-by-stage commits

## 1. Executive decision

Gate2Tray will represent the One Person Company as an independent **Fleet Commerce Operator** who runs onboard meal commerce across several small charter carriers and flights. Gate2Tray is the operator's control plane for pricing opportunities, passenger ordering, inventory coordination, crew fulfillment, exceptions, refunds, and reconciliation.

Gate2Tray is not an airline, caterer, payment processor, or substitute for cabin authority. The airline remains the Air Operator Certificate holder, merchant of record, and operational authority. Licensed caterers remain responsible for food preparation, ingredient declarations, and physical loading. Cabin crew retain final authority over service and safety.

The product will use one bounded `CommerceOpsAgent`, not a theatrical multi-agent swarm. Authoritative arithmetic, policy checks, state transitions, payments, inventory, and safety rules remain deterministic. An optional LLM may later choose among safe read/propose tools and explain a recommendation, but it cannot calculate authoritative prices, issue arbitrary writes, access SQL, or bypass human approval.

## 2. Problem

Small charter carriers can operate multiple flights while lacking a dedicated retail operations team. Meal inventory, gate offers, passenger orders, onboard service, stockouts, refunds, and end-of-day reconciliation become fragmented across spreadsheets, messaging, crew knowledge, and payment records.

A one-person Fleet Commerce Operator needs to:

- supervise several flights without watching every screen continuously;
- identify which flights need commercial action;
- recover contribution margin from likely surplus without unsafe discounting;
- protect inventory and passenger commitments during disruption;
- let crew act quickly without making them commerce administrators;
- resolve exceptions without unsafe automatic substitution;
- reconcile orders, refunds, and returned inventory;
- prove what the agent observed, recommended, approved, and executed.

The current prototype demonstrates one flight and one deterministic scenario. It must become a truthful multi-flight operating model whose decisions change when its inputs change.

## 3. Buyer, users, and operating boundaries

### Economic buyer

The buyer is a charter airline owner, general manager, or commercial lead seeking onboard revenue without creating a full retail-operations team.

### Primary user and OPC owner

The primary user is the one-person Fleet Commerce Operator. This person serves several carrier clients and uses Gate2Tray to replace separate pricing-analysis, order-support, exception-management, and reconciliation roles.

### Workflow users

- **Airline operations or compliance lead:** governs operating and commercial boundaries.
- **Licensed caterer:** supplies verified product, ingredient, and physical loading data.
- **Cabin crew:** controls service state and confirms physical fulfillment or unavailability.
- **Passenger:** orders, consents to a verified substitute, or requests an eligible refund.
- **Airline finance:** receives settlement and anomaly reports.

### Non-negotiable boundaries

- Flight safety always overrides commerce automation.
- Crew can pause service immediately; the agent cannot resume it automatically.
- Gate2Tray never infers allergen compatibility from names or partial label overlap.
- Passenger substitution always requires an explicit choice.
- The airline remains merchant of record in the prototype and target operating model.
- Payments and refunds remain visibly simulated until a compliant provider adapter exists.
- Passenger data is purpose-limited; the demo uses flight, seat, order, and consent data rather than names or payment credentials.
- Exact aviation, food-seller, data-controller, and liability roles require validation in carrier contracts and with qualified Singapore counsel.

## 4. Product thesis and business model

### Positioning

> Gate2Tray lets one independent operator run onboard commerce across a charter fleet without each airline hiring a retail-operations team.

### Value proposition

- Recover contribution margin from likely unsold loaded meals.
- Convert many simultaneous flights into one prioritized attention queue.
- Reduce routine crew interactions to fast, role-appropriate actions.
- Resolve stockouts with verified choices, consent, and an audit trail.
- Automate order, inventory, refund, and settlement reconciliation.
- Keep every consequential agent action explainable and reversible where operationally possible.

### Commercial model

The initial model is a productized service:

- monthly airline retainer;
- per-operated-flight fee;
- optional performance bonus against verified contribution-margin or waste-reduction baselines.

The later software model adds flight-volume pricing for additional Fleet Commerce Operators.

### Pilot success metrics

These targets are hypotheses to validate with a real carrier pilot:

- at least 30 flights per week across two clients without added operator headcount;
- 10–15% reduction in unsold loaded units;
- at least 5% contribution-margin uplift against matched flights;
- at least 80% of low-risk observations completed without operator touch;
- 100% of consequential actions policy-checked and audited;
- zero oversells, duplicate refunds, or unverified dietary substitutions;
- median passenger exception resolution under three minutes;
- crew actions completed within two taps and 15 seconds;
- no raw card data stored.

The north-star metric is **incremental contribution margin recovered per operator-hour**.

## 5. Scope and non-goals

### In scope for this implementation

- a fleet overview with at least five realistic mock flights;
- flight selection and isolated per-flight state;
- input-driven demand and surplus evaluation with an honest data-sufficiency state;
- one policy-bounded Commerce Operations Agent;
- versioned recommendations and explicit operator approvals;
- passenger ordering and simulated payment;
- crew fulfillment, service pause, and stockout handling;
- server-enforced safe substitute and idempotent refund rules;
- an auditable event and agent activity trail;
- responsive operator, crew, passenger, and tracking surfaces;
- official shadcn/ui primitives integrated incrementally;
- deterministic tests plus mobile, tablet, and desktop browser coverage;
- lint, typecheck, test, and production-build gates.

### Explicit non-goals

- operating an airline or replacing airline operational control;
- real payment capture or settlement;
- production identity, authentication, or multi-tenant authorization;
- learned demand forecasting without validated historical data;
- autonomous passenger substitution;
- a generalized workflow builder;
- multiple collaborating AI agents;
- production airline, caterer, or PSP integrations;
- legal claims that the demo is allergen-safe or flight-certified.

Although production authentication is out of scope, the prototype still uses an explicit typed demo-role context so passenger, crew, operator, and demo-admin commands cannot cross role boundaries.

## 6. Product experience

### Operator command center

The operator opens a fleet-level attention queue rather than a hard-coded flight. Each flight shows departure time, ordering/service state, sell-through, projected surplus range, active exceptions, pending approvals, and data freshness.

Selecting a flight opens its workspace:

1. observed evidence;
2. agent recommendation or clear no-action result;
3. checked policy constraints;
4. approval requirement;
5. execution outcome;
6. linked audit events.

The operator can edit policy through versioned changes, never by mutating hidden constants.

### Crew surface

Crew sees only the selected flight, service controls, cabin-section queues, inventory, and exceptions. Crew can start or pause service, mark an item unavailable, and confirm delivery. Commerce recommendations remain outside the crew surface.

### Passenger ordering and resolution

Passengers receive a flight-specific menu, simulated checkout, reservation status, and a tracking link. When an item becomes unavailable, Gate2Tray offers only different, currently available products that satisfy every verified hard dietary requirement and protected-stock rule. If none qualify, the refund path remains visible.

### Fleet close

The operator sees per-flight order, refund, returned-inventory, and anomaly summaries. The prototype uses simulated provider records but models the reconciliation states explicitly.

## 7. Multi-flight scenario catalog

The demo seed will include fictional carriers and routes. All data is synthetic.

| Flight | Scenario | Required agent or human outcome |
|---|---|---|
| MC201 — Merlion Charter, Singapore to Langkawi | Moderate surplus before departure | Recommend a bounded gate offer using live structured inputs; require operator approval. |
| SA418 — Straits Air, Singapore to Bali | Near sell-out and protected final units | Produce a no-discount result and explain why stock protection has priority. |
| IH307 — Island Hopper, Seletar to Tioman | Supplier shortfall affecting a meal with multiple dietary requirements | Freeze the SKU, identify affected orders, offer only fully compatible substitutes, otherwise refund. |
| OE105 — Orchard Executive, Singapore to Penang | Delay and aircraft change alters seats, capacity, and loaded inventory | Mark prior recommendation stale; require refreshed loading confirmation before new action. |
| SB660 — Seabreeze Aviation, Singapore to Phuket | Turbulence or connectivity interruption during service | Crew pauses service; reservations remain protected; queued mutations reconcile idempotently after recovery. |
| Fleet close fixture | Twelve completed synthetic flights | Reconcile exact matches automatically and escalate refund, inventory, or payment anomalies. |

Each scenario must be selectable and resettable without affecting other flights.

## 8. System architecture

```text
Operator / Crew / Passenger / Tracker UI
                    |
             role-scoped commands
                    |
 Flight | Inventory | Commerce | Fulfillment services
                    |
       Policy kernel + approval/consent gates
              |                 |
         SQLite state      append-only events
              ^                 |
              +---- agent executor ----+
                         |
                CommerceOpsAgent
```

### Domain boundaries

- **Flight Operations:** flight lifecycle, manifest snapshot, departure, gate, aircraft-change and service state.
- **Inventory:** loaded, reserved, unavailable, protected units, and concurrency.
- **Commerce:** flight menu, price snapshots, orders, simulated payments, and refunds.
- **Fulfillment:** cabin queues, delivery, unavailable-item exceptions, and passenger choices.
- **Policy and Approval:** immutable policy versions, deterministic decisions, approvals, expiry, and action digests.
- **Agent Control Plane:** runs, tool calls, forecasts, recommendations, and audit links. It owns no commerce records and writes only through domain services.

Every query and command carries `flightId`; no global current flight exists.

## 9. CommerceOpsAgent

### Pattern

One agent operates on one flight per run:

1. create a run and acquire a per-flight lock;
2. read a versioned flight snapshot;
3. call deterministic demand evaluation;
4. call the policy kernel;
5. finish with no action when evidence is insufficient or no beneficial action exists;
6. persist one evidence-backed recommendation with policy and state versions;
7. suspend for approval when required;
8. validate role, approval digest, expiry, policy version, and unchanged state;
9. execute once with an idempotency key;
10. read back the result and append audit events.

### Tool catalog

| Tool | Purpose and boundary |
|---|---|
| `get_flight_context` | Read versioned flight, manifest, menu, inventory, orders, exceptions, policy, and existing recommendations. |
| `forecast_demand` | Deterministically return feature inputs, algorithm version, demand range, and data sufficiency. Never invent confidence. |
| `propose_gate_offer` | Evaluate candidate offers through policy and persist the best permitted recommendation or no-action result. |
| `publish_gate_offer` | Execute one approved, unexpired recommendation against an expected state version and idempotency key. |
| `prepare_exception_options` | Return only different, available, fully compatible substitutes plus refund eligibility. |
| `apply_passenger_resolution` | Apply a signed one-use passenger choice after revalidating inventory and policy. |
| `issue_refund` | Use authoritative order/payment values and return the original result on repeated calls. |

Runtime context injects actor, role, run ID, correlation ID, and authorization data; a model cannot supply or override them.

### Tool result contract

All tools return either versioned success data or a typed, actionable error. Required error classes are `NOT_FOUND`, `FORBIDDEN`, `STALE_VERSION`, `INVALID_TRANSITION`, `POLICY_DENIED`, `APPROVAL_REQUIRED`, `INVENTORY_CONFLICT`, `PROVIDER_UNAVAILABLE`, and `IDEMPOTENCY_MISMATCH`.

### Human and safety gates

| Action | Gate |
|---|---|
| Observe, evaluate, draft recommendation, log | Automatic |
| Publish any MVP price change | Operator approval |
| Substitute a meal | Explicit passenger choice |
| Refund below threshold | Passenger choice plus valid captured-payment simulation and policy |
| Refund at or above threshold | Passenger choice plus operator approval |
| Mark unavailable, pause service, confirm delivery | Crew action |
| Resume after safety pause | Crew action |
| Change policy | Operator creates a new immutable version |
| Reset demo | Demo-admin action, clearly separated from ordinary audit events |

An approval signs the exact action digest, expires, and becomes superseded if relevant state or policy changes.

### Optional LLM boundary

The first implementation does not require an LLM. If Claude is added later, it may decide whether more evidence is required, choose among read/propose tools, and explain the result. It cannot perform authoritative arithmetic, access SQL or arbitrary HTTP, select a passenger meal, issue an unapproved write, or store hidden chain-of-thought. Model failure falls back to deterministic evaluation or a safe no-action result.

## 10. Data model and state transitions

### Essential entities

- `operators` and `carrier_clients`;
- `flights` with lifecycle and optimistic version;
- `menu_items` and `flight_menu_items` with verified requirement labels;
- `flight_inventory` with loaded, reserved, unavailable, protected, and version fields;
- `orders` with price snapshot, payment status, fulfillment status, and version;
- `payments` and `refunds` with provider mode, reference, status, and idempotency key;
- `policy_versions`;
- `forecasts` with feature snapshot and algorithm version;
- `recommendations` with evidence, action payload, state/policy versions, digest, expiry, and status;
- `approvals` and passenger decision tokens;
- `agent_runs` and `tool_calls`;
- append-only `domain_events` for audit and surface synchronization.

### State machines

- Flight: `draft → ordering_open → boarding_closed → in_service → completed`.
- Order: `pending_payment → reserved → preparing → delivered`.
- Exception: `reserved/preparing → action_required → substituted → reserved`.
- Refund: `action_required → refund_pending → refunded`.
- Recommendation: `proposed → approval_pending → approved/rejected/expired → executing → executed/failed/superseded`.
- Agent run: `running → waiting_for_approval → running → completed/failed/cancelled`.

Terminal order states cannot be reopened by ordinary commands. Database mutations update only affected rows inside transactions; the current full-table delete-and-reinsert behavior will be removed.

## 11. Demand and offer evaluation

The prototype forecast is an explainable, versioned heuristic rather than a learned model. Inputs include:

- manifest passenger count and completeness;
- current reservations and reservation velocity;
- minutes to ordering close or departure;
- loaded and protected units by item;
- item price, cost, and current contribution margin;
- historical or scenario conversion baseline;
- operational disruption flags;
- input freshness and completeness.

Outputs include an expected demand range, projected surplus range, data-sufficiency status, algorithm version, and feature snapshot. A recommendation must quantify expected sell-through and contribution-margin effect. Missing evidence returns `needs_data`; the UI must not display fabricated precision.

## 12. Responsive shadcn/ui system

### Migration decision

Use a compatibility-first migration with the official shadcn registry. Add `components.json`, preserve the existing import aliases and OKLCH brand tokens, preview registry changes, and migrate one primitive or surface per commit. Never overwrite `app/globals.css` or source-owned components blindly.

The component system—not a chat interface—is the goal. Gate2Tray remains action-first and avoids chat as the primary operational control.

### Primitive mapping

| Need | shadcn composition |
|---|---|
| Actions and pending state | `Button` plus `Spinner` and disabled state |
| Status | `Badge` with preserved success, warning, danger, neutral, and primary variants |
| Content panels | Full `Card` composition |
| Forms | `FieldGroup`, `Field`, `Label`, `Input`, `RadioGroup`, and inline field errors |
| Informational or operational callout | `Alert` |
| Consequential confirmation | `AlertDialog` |
| Secondary modal | `Dialog` |
| Mobile navigation or task panel | `Sheet` |
| Navigation | `Sidebar` on desktop and `Sheet` on compact screens |
| Stock display | `Progress` plus textual current/maximum values |
| Loading | Route-shaped `Skeleton` components |
| Empty state | `Empty` |
| Feedback | Inline errors plus `sonner` for non-critical confirmations |
| Long activity | `ScrollArea`; custom accessible timeline remains source-owned |
| Mobile disclosure | `Accordion` where hiding content is operationally safe |

### Breakpoint contract

| Width | Navigation and layout |
|---|---|
| 320–639px | Compact top bar and `Sheet`; one column; full-width cards; safe-area-aware actions. |
| 640–767px | Compact shell; limited two-column card groups; 24px gutters. |
| 768–1023px | Tablet shell; 2×2 operator metrics; menu in two columns; secondary panels below primary content. |
| 1024–1279px | Persistent 232px sidebar; main/aside grids; passenger sticky checkout card. |
| 1280px and above | Full sidebar; wide operator and crew layouts; maximum content width 1480px. |

Acceptance applies at 320, 375, 640, 768, 1024, 1280, and 1440px:

- no horizontal page overflow;
- no hidden or overlapped critical action;
- every touch target at least 44×44px, with 48px preferred for crew actions;
- narrow screens reflow rather than shrink essential text;
- QR includes a direct open/copy alternative;
- keyboard order follows visual and task order;
- status remains understandable without color.

### Surface behavior

- **Operator:** mobile priority order is exceptions, agent action, approval, inventory, QR, activity; tablet metrics use 2×2; desktop uses sidebar and decision/aside layout.
- **Passenger:** mobile meal selection uses semantic radio cards and a bottom review `Sheet`; tablet uses a two-column menu without a cramped permanent rail; desktop uses a sticky checkout card.
- **Crew:** mobile uses one-handed controls and an always-visible service action bar; tablet keeps section counts visible; desktop shows all cabin queues plus a sticky inventory card.
- **Tracker:** centered single-task layout at all sizes, explicit compatible choices, visible refund fallback, and stable terminal states.

### Loading, offline, and errors

The provider exposes `connectionStatus`, `lastUpdatedAt`, and per-command pending/error state. Routes include layout-shaped loading states. Reconnecting preserves last-known data with a visible stale banner. Offline state never presents seeded client state as live. Mutation errors appear beside the initiating action; critical operational failures are never toast-only.

## 13. Real-world stress boundaries

- **Turbulence:** crew pause is immediate, suppresses nonessential prompts, and cannot be overridden by commerce automation.
- **Intermittent connectivity:** writes are idempotent; stale versions are rejected; queued events reconcile after recovery.
- **Aircraft or seat change:** recommendations become stale and cannot execute until manifest and loading are reconfirmed.
- **Supplier recall or shortfall:** sales freeze by verified SKU across affected flights; no label inference.
- **Concurrency:** simultaneous orders cannot consume protected units or oversell inventory.
- **Payment uncertainty:** timeout remains pending until provider reconciliation; retries cannot duplicate refunds.
- **Privacy:** agent inputs exclude unnecessary PII and payment credentials; logs retain evidence and outcomes rather than hidden reasoning.
- **Stage demo:** the app remains fully demonstrable with simulated payments and deterministic agent logic when external AI or network services are unavailable.

## 14. Quality and evaluation system

### Deterministic agent and domain cases

1. No surplus produces no discount or approval request.
2. Discounts above policy or below minimum margin are rejected.
3. Inventory changes supersede an existing recommendation.
4. Concurrent orders cannot consume protected final units.
5. Same-item, unavailable, partially compatible, or understocked substitutes are rejected server-side.
6. Repeated refund requests return one result and release inventory once.
7. Delivered or refunded orders reject invalid future transitions.
8. Passenger commands cannot invoke operator or crew operations.
9. A command for flight A cannot read or mutate flight B.
10. Expired, altered, or replayed approvals are rejected.
11. Provider timeout followed by retry yields one refund.
12. Agent or model outage produces a visible degraded state and no fabricated recommendation.
13. Every executed action links evidence, policy, approval, tool call, and resulting event.
14. Fixed inputs produce versioned repeatable outputs; changing real inputs changes the result.

### UI and deployment gates

- lint passes;
- TypeScript typecheck passes;
- deterministic tests pass;
- production build passes;
- browser smoke test completes the operator → passenger → crew → resolution → audit flow;
- viewport checks pass at all specified widths;
- keyboard navigation, focus restoration, reduced motion, and WCAG 2.2 AA contrast receive manual verification;
- generated `.next` and dependency directories remain untracked.

## 15. Stage and commit plan

Each stage must leave the repository buildable and receive its own real commit. Existing history is not rewritten.

1. **PRD** — `docs: define the Fleet Commerce OPC platform`
   - This document, sources, decisions, scope, and acceptance criteria.
2. **Quality foundation** — `chore: add quality gates and shadcn foundation`
   - Test/lint configuration, `components.json`, tokens, and initial official primitives.
3. **Domain correctness** — `test: specify multi-flight commerce invariants`, then `feat: enforce commerce domain invariants`
   - Red tests first; state transitions, safe substitution, idempotency, typed errors.
4. **Multi-flight data** — `feat: add fleet state and realistic scenarios`
   - Five flights, scenario reset, isolated state, versioned policies.
5. **Agent control plane** — `test: specify policy-agent outcomes`, then `feat: add the bounded commerce operations agent`
   - Forecast inputs, recommendation, approval digest, execution, audit.
6. **Responsive passenger and tracker UI** — `feat: migrate passenger flows to responsive shadcn ui`
7. **Responsive crew UI** — `feat: migrate crew operations to responsive shadcn ui`
8. **Responsive operator UI** — `feat: add the responsive fleet command center`
9. **Scenario and responsive QA** — `test: cover fleet scenarios and responsive workflows`
10. **Deployment readiness** — `fix: close deployment and demo readiness gaps`
    - Final lint, typecheck, tests, build, local production smoke test, documentation, and credits.

No stage commit includes `.next`, dependency directories, SQLite runtime files, credentials, or generated logs.

## 16. Acceptance criteria

### Product

- The operator identity is unmistakably an independent one-person Fleet Commerce Operator serving multiple charter clients.
- At least five flights demonstrate meaningfully different commercial and operational scenarios.
- The operator can move from fleet attention queue to a specific evidence-backed decision.
- The complete operator, passenger, crew, resolution, and audit workflow remains coherent.

### Agent and domain

- One agent run targets one selected flight and returns one recommendation, no-action, or needs-data result.
- Recommendation values demonstrably change with structured inputs.
- No consequential action bypasses required role, consent, approval, or server policy.
- Approved writes execute exactly once and reject stale state.
- Flight data remains isolated across concurrent runs.
- Direct API calls cannot bypass UI restrictions.
- Every executed action is reconstructable from immutable audit records.

### UI

- Official shadcn primitives are integrated without erasing the existing Gate2Tray visual identity.
- Operator, crew, passenger, and tracker routes work at mobile, tablet, and desktop widths.
- No target viewport has horizontal overflow or sticky-action overlap.
- Forms are labelled, status is non-color-only, and controls meet touch and keyboard requirements.
- Loading, reconnecting, offline, empty, invalid-ID, pending, error, and terminal states are represented.

### Delivery

- Every implementation stage has a focused commit with honest chronology.
- Lint, typecheck, tests, and production build pass from the documented clean setup.
- No generated build or dependency files are tracked.
- README documents the OPC, scenarios, agent boundary, simulated integrations, and demo workflow truthfully.

## 17. Principal risks and mitigations

| Risk | Mitigation |
|---|---|
| Polished automation is mistaken for unbounded AI | Show versioned inputs, policy checks, approvals, and deterministic outcomes. |
| Unsafe dietary claim | Use caterer-verified hard constraints, require all constraints, enforce server-side, and avoid medical guarantees. |
| Shadcn initialization overwrites brand CSS | Preview CLI diffs, merge tokens manually, and migrate incrementally. |
| Multi-flight rewrite breaks demo | Build domain tests first and keep each stage buildable. |
| Venue network breaks QR flow | Provide direct links, pre-open tabs, use a hotspot, and keep an offline recording. |
| Native SQLite dependency fails during setup | Preinstall on the stage machine and document a known-good Node/runtime setup. |
| Mock metrics appear validated | Label commercial targets and historical conversion inputs as explicit hypotheses or scenario fixtures. |
| Broad scope exceeds hackathon time | Preserve a deterministic offline core; defer real integrations and optional LLM planner. |

## 18. Authoritative references

- CAAS Air Operator Certificate requirements: https://www.caas.gov.sg/industry/aircraft-operators/singapore-air-operator/air-operator-certificate/
- CAAS becoming a Singapore air operator: https://www.caas.gov.sg/industry/aircraft-operators/singapore-air-operator/becoming-a-singapore-air-operator/
- CAAS turbulence injury prevention advisory: https://www.caas.gov.sg/docs/default-source/pdf/ac121-2-5%28rev-0%29-preventing-injuries-caused-by-turbulence.pdf
- Singapore Food Agency licensing guidance: https://www.sfa.gov.sg/food-retail/licence-permit/businesses-that-need-licence-permit-for-food-retail
- Singapore Food Agency allergy and intolerance guidance: https://www.sfa.gov.sg/food-safety-tips/food-risk-concerns/food-allergy-intolerance
- PDPC data-protection obligations under the PDPA: https://www.pdpc.gov.sg/-/media/Files/PDPC/PDF-Files/Resource-for-Organisation/Data-Protection-Obligations-under-the-PDPA.ashx?la=en
- PCI SSC outsourcing and service-provider guidance: https://www.pcisecuritystandards.org/faqs/1092/
- shadcn/ui documentation: https://ui.shadcn.com/docs
