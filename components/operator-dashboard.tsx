"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  ArrowRight,
  Bot,
  Check,
  CircleAlert,
  Clock3,
  ExternalLink,
  PackageCheck,
  Plane,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateSurplus } from "@/lib/agent-tools";
import type { AgentOutcome, Flight } from "@/lib/types";
import { cn, formatCurrency, formatTime } from "@/lib/utils";

const outcomeLabels: Record<AgentOutcome, string> = {
  recommendation: "Approval ready",
  no_action: "No action",
  needs_data: "Needs evidence",
  exception: "Exception",
  safety_hold: "Safety hold",
};

export function OperatorDashboard() {
  const { state, hydrated, mutating, mutationError, runAgent, approveDiscount } = useDemo();
  const [selectedFlightId, setSelectedFlightId] = useState("MC201");
  const [orderUrl, setOrderUrl] = useState("");
  const flight = state.flights.find((entry) => entry.id === selectedFlightId) ?? state.flights[0];

  useEffect(() => {
    if (!state.flights.some((entry) => entry.id === selectedFlightId) && state.flights[0]) {
      const updateSelection = window.setTimeout(() => setSelectedFlightId(state.flights[0].id), 0);
      return () => window.clearTimeout(updateSelection);
    }
  }, [selectedFlightId, state.flights]);

  useEffect(() => {
    if (!flight) return;
    const updateUrl = window.setTimeout(
      () => setOrderUrl(`${window.location.origin}/order/${flight.id}`),
      0,
    );
    return () => window.clearTimeout(updateUrl);
  }, [flight]);

  const flightInventory = useMemo(
    () => state.inventory.filter((row) => row.flightId === flight?.id),
    [flight?.id, state.inventory],
  );
  const flightOrders = useMemo(
    () => state.orders.filter((order) => order.flightId === flight?.id),
    [flight?.id, state.orders],
  );
  const flightActions = useMemo(
    () => state.agentActions.filter((action) => action.flightId === flight?.id),
    [flight?.id, state.agentActions],
  );
  const totals = useMemo(
    () => flightInventory.reduce((summary, row) => ({
      loaded: summary.loaded + row.loaded,
      reserved: summary.reserved + row.reserved,
      remaining: summary.remaining + Math.max(0, row.loaded - row.reserved),
    }), { loaded: 0, reserved: 0, remaining: 0 }),
    [flightInventory],
  );

  if (!flight) {
    return <main className="mx-auto max-w-7xl p-4 sm:p-6"><Skeleton className="h-96 w-full" /></main>;
  }

  const forecast = state.forecasts[flight.id];
  const approval = state.discountApprovals[flight.id];
  const agentRun = state.agentRuns[flight.id];
  const revenue = flightOrders.filter((order) => order.status !== "refunded").reduce((total, order) => total + order.amount, 0);
  const surplus = calculateSurplus(state, flight.id);
  const exceptions = flightOrders.filter((order) => order.status === "action_required").length;
  const runDisabled = !hydrated || mutating || approval === "pending";

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
      <section aria-labelledby="fleet-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-strong">One-person fleet commerce company</p>
            <h1 id="fleet-title" className="mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-[28px]">Fleet command center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Five synthetic flights exercise revenue judgment, restraint, passenger consent, stale-data safety, and crew authority.</p>
          </div>
          <Badge tone="neutral" className="w-fit">Synthetic operations · Demo mode</Badge>
        </div>

        <div className="mt-5 grid gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {state.flights.map((entry) => {
            const entryForecast = state.forecasts[entry.id];
            const selected = entry.id === flight.id;
            const unresolved = state.orders.filter((order) => order.flightId === entry.id && order.status === "action_required").length;
            return (
              <Card key={entry.id} size="sm" className={cn("min-w-0 transition-[box-shadow,ring-color]", selected && "ring-2 ring-primary")}>
                <button
                  type="button"
                  onClick={() => setSelectedFlightId(entry.id)}
                  aria-pressed={selected}
                  className="min-h-32 w-full px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="font-semibold">{entry.flightNumber}</p><p className="truncate text-xs text-muted-foreground">{entry.destination}</p></div>
                    <FlightStateBadge flight={entry} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{entry.operations.scenarioLabel}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <OutcomeBadge outcome={entryForecast?.outcome} />
                    {unresolved > 0 && <span className="text-xs font-semibold text-danger-strong">{unresolved} unresolved</span>}
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator className="my-6" />

      {mutationError && <Alert variant="destructive" className="mb-5 p-4"><CircleAlert className="size-5" /><AlertTitle>Operation did not complete</AlertTitle><AlertDescription>{mutationError}</AlertDescription></Alert>}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" aria-labelledby="flight-title">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="flight-title" className="text-2xl font-semibold tracking-[-0.025em]">{flight.flightNumber} operations</h2>
            <FlightStateBadge flight={flight} />
            <OutcomeBadge outcome={forecast?.outcome} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{flight.airline} · {flight.origin} to {flight.destination} · Gate {flight.gate}</p>
          <p className="mt-1 text-xs text-muted-foreground">{flight.operations.scenarioLabel} · State v{flight.operations.stateVersion}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex">
          <Button variant="outline" asChild><Link href={`/crew/${flight.id}`}>Open crew screen <ExternalLink className="h-4 w-4" /></Link></Button>
          <Button onClick={() => runAgent(flight.id)} disabled={runDisabled}>
            <Sparkles className="h-4 w-4" /> {forecast ? "Run agent again" : "Run Operations Agent"}
          </Button>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Selected flight metrics">
        <Metric icon={UsersRound} label="Passengers" value={`${flight.passengers}`} detail={flight.operations.manifestComplete ? "Manifest confirmed" : "Manifest incomplete"} />
        <Metric icon={PackageCheck} label="Inventory" value={`${totals.remaining} remaining`} detail={`${totals.loaded} loaded · ${totals.reserved} reserved`} />
        <Metric icon={Plane} label="Revenue" value={formatCurrency(revenue)} detail={`${flightOrders.length} passenger orders`} />
        <Metric icon={CircleAlert} label="Projected surplus" value={forecast?.projectedSurplusRange ? `${forecast.projectedSurplusRange.low}–${forecast.projectedSurplusRange.high}` : "—"} detail={`${formatCurrency(surplus.value)} maximum loaded-cost exposure`} attention={forecast?.outcome === "recommendation"} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          {exceptions > 0 && (
            <Alert variant="destructive" className="p-4" aria-live="polite">
              <CircleAlert className="size-5" />
              <AlertTitle>{exceptions} passenger {exceptions === 1 ? "choice" : "choices"} unresolved</AlertTitle>
              <AlertDescription>A compatible substitute or refund is waiting on explicit passenger approval. <Link href={`/crew/${flight.id}`}>Review crew exceptions</Link>.</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-strong"><Bot className="size-4" /> Bounded CommerceOpsAgent</div>
              <CardTitle className="mt-1 text-xl">Demand and surplus decision</CardTitle>
              <CardDescription>One flight per run. Deterministic tools own arithmetic and policy; publication always waits for operator approval.</CardDescription>
              <CardAction>{forecast && <OutcomeBadge outcome={forecast.outcome} />}</CardAction>
            </CardHeader>
            <CardContent>
              {!forecast ? (
                <div className="flex flex-col items-start justify-between gap-4 rounded-lg bg-surface p-4 sm:flex-row sm:items-center">
                  <div><p className="font-semibold">Ready to evaluate {flight.flightNumber}</p><p className="mt-1 text-sm text-muted-foreground">Uses versioned manifest, velocity, conversion, stock, margin, freshness, and operational holds.</p></div>
                  <Button onClick={() => runAgent(flight.id)} disabled={!hydrated || mutating}><Sparkles className="size-4" /> Run agent</Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ForecastDatum label="Expected demand" value={forecast.expectedOrdersRange ? `${forecast.expectedOrdersRange.low}–${forecast.expectedOrdersRange.high}` : "Not calculated"} detail={forecast.dataSufficiency === "needs_data" ? "Evidence incomplete" : "orders · deterministic range"} />
                    <ForecastDatum label="Projected surplus" value={forecast.projectedSurplusRange ? `${forecast.projectedSurplusRange.low}–${forecast.projectedSurplusRange.high}` : "Not calculated"} detail="units above protected stock" />
                    <ForecastDatum label="Agent outcome" value={outcomeLabels[forecast.outcome]} detail={forecast.recommendedDiscount ? `${forecast.recommendedDiscount}% candidate offer` : "No price mutation"} emphasized={forecast.outcome === "recommendation"} />
                  </div>
                  <Alert className="mt-4 bg-surface p-4">
                    {forecast.outcome === "safety_hold" ? <ShieldAlert className="size-5" /> : <Bot className="size-5" />}
                    <AlertTitle>{forecast.explanation}</AlertTitle>
                    <AlertDescription>{forecast.requiredAction} · {forecast.algorithmVersion} · State v{forecast.featureSnapshot.stateVersion}</AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {approval === "pending" && forecast && (
            <Alert className="border-primary/25 bg-primary-soft p-5" aria-live="polite">
              <Sparkles className="size-5 text-primary-strong" />
              <AlertTitle>Publish a {forecast.recommendedDiscount}% gate discount?</AlertTitle>
              <AlertDescription>
                {forecast.explanation} Margin remains {forecast.remainingMargin}%; the final two units of every meal stay protected.
                <Button onClick={() => approveDiscount(flight.id)} disabled={mutating} className="mt-4 w-full sm:w-auto">Approve and publish <ArrowRight className="size-4" /></Button>
              </AlertDescription>
            </Alert>
          )}

          {approval === "approved" && (
            <Alert className="border-success/25 bg-success-soft p-4 text-success-strong" aria-live="polite">
              <Check className="size-5" />
              <AlertTitle>{flight.currentDiscount}% discount published</AlertTitle>
              <AlertDescription className="text-success-strong">The passenger menu is updated and the exact operator-approved action is audit logged.</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Loaded inventory</CardTitle>
              <CardDescription>Flight-scoped stock; reservations update without touching another flight.</CardDescription>
              <CardAction><Badge tone="neutral">{totals.remaining} available</Badge></CardAction>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {state.menuItems.map((item) => {
                const row = flightInventory.find((entry) => entry.itemId === item.id);
                if (!row) return null;
                const remaining = row.loaded - row.reserved;
                const percent = row.loaded > 0 ? (remaining / row.loaded) * 100 : 0;
                return (
                  <div key={item.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_210px_80px] sm:items-center">
                    <div><p className="text-sm font-semibold">{item.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.loaded} loaded · {row.reserved} reserved{row.unavailable ? " · unavailable" : ""}</p></div>
                    <Progress value={percent} aria-label={`${remaining} of ${row.loaded} remaining`} className={cn("h-2", remaining <= 2 && "[&_[data-slot=progress-indicator]]:bg-danger")} />
                    <div className="text-left text-sm font-semibold tabular-nums sm:text-right">{remaining} left</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:block xl:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Passenger ordering QR</CardTitle>
              <CardDescription>Scan or open the direct {flight.flightNumber} menu link.</CardDescription>
              <CardAction><Badge tone={flight.currentDiscount ? "primary" : "neutral"}>{flight.currentDiscount ? `${flight.currentDiscount}% live` : "Full price"}</Badge></CardAction>
            </CardHeader>
            <CardContent>
              {orderUrl ? (
                <div className="mx-auto mb-5 w-fit rounded-lg border border-border bg-background p-4"><QRCode value={orderUrl} size={164} fgColor="oklch(0.205 0.025 330)" bgColor="oklch(1 0 0)" /></div>
              ) : (
                <Skeleton className="mx-auto mb-5 h-[198px] w-[198px]" aria-hidden="true" />
              )}
              <Button variant="outline" asChild className="w-full"><Link href={`/order/${flight.id}`}>Preview passenger menu <ArrowRight className="size-4" /></Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent activity</CardTitle>
              <CardDescription>{agentRun ? `${agentRun.toolCalls.length} bounded tools · ${agentRun.status.replaceAll("_", " ")}` : "No run for this flight yet."}</CardDescription>
              <CardAction><Badge tone="neutral">Audit</Badge></CardAction>
            </CardHeader>
            <CardContent>
              {flightActions.length === 0 ? (
                <p className="rounded-lg bg-surface p-4 text-sm text-muted-foreground">Run the agent or use a flight workflow to create scoped audit events.</p>
              ) : (
                <ol className="space-y-0">
                  {flightActions.slice(0, 8).map((entry, index) => (
                    <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {index < Math.min(flightActions.length, 8) - 1 && <span className="absolute left-[9px] top-5 h-[calc(100%-4px)] w-px bg-border" aria-hidden="true" />}
                      <span className={cn("relative mt-1 h-[19px] w-[19px] shrink-0 rounded-full border-[5px] border-background", entry.type === "exception" ? "bg-danger" : entry.type === "approved" ? "bg-primary" : entry.type === "executed" ? "bg-success" : "bg-muted-foreground")} aria-hidden="true" />
                      <div className="min-w-0"><div className="flex flex-wrap items-baseline justify-between gap-x-3"><p className="text-sm font-semibold">{entry.title}</p><time className="text-xs text-muted-foreground">{formatTime(entry.timestamp)}</time></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{entry.detail}</p></div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function FlightStateBadge({ flight }: { flight: Flight }) {
  const tone = flight.serviceStatus === "paused" ? "danger" : flight.serviceStatus === "active" ? "success" : "neutral";
  const label = flight.serviceStatus === "paused" ? "Paused" : flight.serviceStatus === "active" ? "In service" : "Preflight";
  return <Badge tone={tone}>{label}</Badge>;
}

function OutcomeBadge({ outcome }: { outcome?: AgentOutcome }) {
  if (!outcome) return <Badge tone="neutral">Not evaluated</Badge>;
  const tone = outcome === "recommendation" ? "warning" : outcome === "no_action" ? "success" : outcome === "needs_data" ? "neutral" : "danger";
  return <Badge tone={tone}>{outcomeLabels[outcome]}</Badge>;
}

function Metric({ icon: Icon, label, value, detail, attention = false }: { icon: typeof Clock3; label: string; value: string; detail: string; attention?: boolean }) {
  return (
    <Card size="sm" className="min-w-0">
      <CardContent className="flex gap-3 pt-1">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", attention ? "bg-warning-soft text-warning-strong" : "bg-secondary text-muted-foreground")}><Icon className="size-4.5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-lg font-semibold tabular-nums">{value}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p></div>
      </CardContent>
    </Card>
  );
}

function ForecastDatum({ label, value, detail, emphasized = false }: { label: string; value: string; detail: string; emphasized?: boolean }) {
  return <div className={cn("rounded-lg p-4", emphasized ? "bg-primary-soft" : "bg-surface")}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={cn("mt-1 text-xl font-semibold tabular-nums sm:text-2xl", emphasized && "text-primary-strong")}>{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}
