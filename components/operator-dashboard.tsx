"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { ArrowRight, Bot, Check, CircleAlert, Clock3, ExternalLink, PackageCheck, Plane, Sparkles, UsersRound } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { calculateSurplus } from "@/lib/agent-tools";
import { formatCurrency, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function OperatorDashboard() {
  const { state, hydrated, runAgent, approveDiscount } = useDemo();
  const [orderUrl, setOrderUrl] = useState("http://localhost:3000/order/MC201");

  useEffect(() => {
    const updateUrl = window.setTimeout(
      () => setOrderUrl(`${window.location.origin}/order/${state.flight.id}`),
      0,
    );
    return () => window.clearTimeout(updateUrl);
  }, [state.flight.id]);

  const totals = useMemo(() => state.inventory.reduce((summary, row) => ({
    loaded: summary.loaded + row.loaded,
    reserved: summary.reserved + row.reserved,
    remaining: summary.remaining + Math.max(0, row.loaded - row.reserved),
  }), { loaded: 0, reserved: 0, remaining: 0 }), [state.inventory]);

  const revenue = state.orders.filter((order) => order.status !== "refunded").reduce((total, order) => total + order.amount, 0);
  const surplus = calculateSurplus(state);
  const exceptions = state.orders.filter((order) => order.status === "action_required").length;

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-[28px]">MC201 operations</h1>
            <Badge tone={state.flight.serviceStatus === "paused" ? "danger" : "success"}>
              {state.flight.serviceStatus === "paused" ? "Service paused" : "On schedule"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{state.flight.airline} · {state.flight.origin} to {state.flight.destination} · Gate {state.flight.gate}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href={`/crew/${state.flight.id}`}>Open crew screen <ExternalLink className="h-4 w-4" /></Link></Button>
          <Button onClick={() => runAgent(state.flight.id)} disabled={!hydrated || state.discountApproval === "pending"}>
            <Sparkles className="h-4 w-4" /> {state.forecast ? "Run agent again" : "Run Operations Agent"}
          </Button>
        </div>
      </div>

      <section className="grid border-b border-border py-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Flight metrics">
        <Metric icon={UsersRound} label="Passengers" value={`${state.flight.passengers}`} detail="92% manifest loaded" />
        <Metric icon={PackageCheck} label="Inventory" value={`${totals.remaining} remaining`} detail={`${totals.loaded} loaded · ${totals.reserved} reserved`} />
        <Metric icon={Plane} label="Revenue" value={formatCurrency(revenue)} detail={`${state.orders.length} passenger orders`} />
        <Metric icon={CircleAlert} label="Estimated surplus" value={`${state.forecast?.projectedSurplusUnits ?? 6} meals`} detail={`${formatCurrency(surplus.value)} loaded cost at risk`} attention={Boolean(state.forecast)} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          {exceptions > 0 && (
            <section className="flex flex-col gap-4 rounded-xl bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
              <div className="flex gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger-strong" />
                <div><h2 className="font-semibold text-danger-strong">{exceptions} passenger {exceptions === 1 ? "choice" : "choices"} unresolved</h2><p className="mt-1 text-sm text-danger-strong">A substitute or refund is waiting on passenger approval.</p></div>
              </div>
              <Button variant="outline" asChild className="border-danger/30 bg-background"><Link href={`/crew/${state.flight.id}`}>Review exceptions</Link></Button>
            </section>
          )}

          <section className="rounded-xl bg-background p-5 shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary-strong"><Bot className="h-4.5 w-4.5" /> Operations agent</div>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Demand and surplus decision</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">The agent can forecast demand and recommend a bounded gate discount. Publication always waits for your approval.</p>
              </div>
              {state.forecast && <Badge tone="success">Forecast complete</Badge>}
            </div>

            {!state.forecast ? (
              <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-lg bg-surface p-4 sm:flex-row sm:items-center">
                <div><p className="font-semibold">Ready to evaluate MC201</p><p className="mt-1 text-sm text-muted-foreground">Uses passenger count, reservations, loaded stock, margin, and operator policies.</p></div>
                <Button onClick={() => runAgent(state.flight.id)}><Sparkles className="h-4 w-4" /> Run agent</Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                <ForecastDatum label="Expected meal orders" value={`${state.forecast.expectedOrders}`} detail={`${state.forecast.confidence}% confidence`} />
                <ForecastDatum label="Projected surplus" value={`${state.forecast.projectedSurplusUnits}`} detail="meals after demand" />
                <ForecastDatum label="Recommended action" value={`${state.forecast.recommendedDiscount}% off`} detail="gate orders only" emphasized />
              </div>
            )}
          </section>

          {state.discountApproval === "pending" && state.forecast && (
            <section className="rounded-xl border border-primary/25 bg-primary-soft p-5 sm:p-6" aria-live="polite">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2"><Badge tone="warning">Approval needed</Badge><span className="text-sm text-muted-foreground">Commercial action</span></div>
                  <h2 className="mt-3 text-xl font-semibold">Publish a {state.forecast.recommendedDiscount}% gate discount?</h2>
                  <p className="mt-2 text-sm leading-6 text-foreground">{state.forecast.explanation}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Max discount 15%</span>
                    <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Margin {state.forecast.remainingMargin}%</span>
                    <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Final two units protected</span>
                  </div>
                </div>
                  <Button onClick={() => approveDiscount(state.flight.id)} className="shrink-0">Approve and publish <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </section>
          )}

          {state.discountApproval === "approved" && (
            <section className="flex items-start gap-3 rounded-xl bg-success-soft p-4" aria-live="polite">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success text-white"><Check className="h-4 w-4" /></span>
              <div><h2 className="font-semibold text-success-strong">{state.flight.currentDiscount}% discount published</h2><p className="mt-1 text-sm text-success-strong">The passenger menu is updated and the action is recorded below.</p></div>
            </section>
          )}

          <section className="rounded-xl bg-background p-5 shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)] sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Loaded inventory</h2><p className="mt-1 text-sm text-muted-foreground">Reservations update as passengers order.</p></div><Badge tone="neutral">{totals.remaining} available</Badge></div>
            <div className="mt-5 divide-y divide-border">
              {state.menuItems.map((item) => {
                const row = state.inventory.find((entry) => entry.itemId === item.id)!;
                const remaining = row.loaded - row.reserved;
                return (
                  <div key={item.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_210px_80px] sm:items-center">
                    <div><p className="text-sm font-semibold">{item.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.loaded} loaded · {row.reserved} reserved</p></div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-label={`${remaining} of ${row.loaded} remaining`}><div className={`h-full rounded-full ${remaining <= 2 ? "bg-danger" : "bg-success"}`} style={{ width: `${(remaining / row.loaded) * 100}%` }} /></div>
                    <div className="text-right text-sm font-semibold tabular-nums">{remaining} left</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl bg-background p-5 shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)]">
            <div className="flex items-start justify-between"><div><h2 className="font-semibold">Passenger ordering QR</h2><p className="mt-1 text-sm text-muted-foreground">Scan to open MC201’s live menu.</p></div><Badge tone={state.flight.currentDiscount ? "primary" : "neutral"}>{state.flight.currentDiscount ? `${state.flight.currentDiscount}% live` : "Full price"}</Badge></div>
            <div className="mx-auto my-5 w-fit rounded-lg border border-border bg-background p-4"><QRCode value={orderUrl} size={164} fgColor="oklch(0.205 0.025 330)" bgColor="oklch(1 0 0)" /></div>
            <Button variant="outline" asChild className="w-full"><Link href={`/order/${state.flight.id}`}>Preview passenger menu <ArrowRight className="h-4 w-4" /></Link></Button>
          </section>

          <section className="rounded-xl bg-background p-5 shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)]">
            <div className="flex items-center justify-between"><div><h2 className="font-semibold">Agent activity</h2><p className="mt-1 text-sm text-muted-foreground">Observed, approved, executed.</p></div><Badge tone="neutral">Live</Badge></div>
            <ol className="mt-5 space-y-0">
              {state.agentActions.slice(0, 8).map((entry, index) => (
                <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < Math.min(state.agentActions.length, 8) - 1 && <span className="absolute left-[9px] top-5 h-[calc(100%-4px)] w-px bg-border" aria-hidden="true" />}
                  <span className={`relative mt-1 h-[19px] w-[19px] shrink-0 rounded-full border-[5px] border-background ${entry.type === "exception" ? "bg-danger" : entry.type === "approved" ? "bg-primary" : entry.type === "executed" ? "bg-success" : "bg-muted-foreground"}`} aria-hidden="true" />
                  <div className="min-w-0"><div className="flex flex-wrap items-baseline justify-between gap-x-3"><p className="text-sm font-semibold">{entry.title}</p><time className="text-xs text-muted-foreground">{formatTime(entry.timestamp)}</time></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{entry.detail}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value, detail, attention = false }: { icon: typeof Clock3; label: string; value: string; detail: string; attention?: boolean }) {
  return (
    <div className="flex gap-3 px-0 py-3 first:pl-0 sm:px-5 sm:first:pl-0 xl:border-r xl:border-border xl:last:border-r-0">
      <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${attention ? "bg-warning-soft text-warning-strong" : "bg-secondary text-muted-foreground"}`}><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
      <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div>
    </div>
  );
}

function ForecastDatum({ label, value, detail, emphasized = false }: { label: string; value: string; detail: string; emphasized?: boolean }) {
  return <div className={`rounded-lg p-4 ${emphasized ? "bg-primary-soft" : "bg-surface"}`}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${emphasized ? "text-primary-strong" : ""}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
