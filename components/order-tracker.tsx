"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleDollarSign, Clock3, RefreshCw, ShieldCheck, Utensils } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { OrderStatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { evaluateRefundPolicy, findApprovedSubstitutes } from "@/lib/agent-tools";
import { formatCurrency, formatTime } from "@/lib/utils";

export function OrderTracker({ orderId }: { orderId: string }) {
  const { state, mutating, mutationError, chooseSubstitute, refundOrder } = useDemo();
  const [refundReference, setRefundReference] = useState("");
  const order = state.orders.find((entry) => entry.id === orderId);

  if (!order) return <main className="grid min-h-screen place-items-center bg-surface p-4"><div className="text-center"><h1 className="text-xl font-semibold">Order not found</h1><p className="mt-2 text-sm text-muted-foreground">Check the link in your order confirmation.</p><Button asChild className="mt-5"><Link href="/operator">Open fleet console</Link></Button></div></main>;

  const flight = state.flights.find((entry) => entry.id === order.flightId);
  if (!flight) return <main className="grid min-h-screen place-items-center bg-surface p-4"><p>Flight not found.</p></main>;
  const item = state.menuItems.find((entry) => entry.id === order.itemId)!;
  const originalItem = order.originalItemId ? state.menuItems.find((entry) => entry.id === order.originalItemId) : null;
  const substitutes = findApprovedSubstitutes(state, order);
  const refundPolicy = evaluateRefundPolicy(order.amount);
  const isComplete = order.status === "delivered" || order.status === "refunded";

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background"><div className="mx-auto flex max-w-2xl flex-col items-start justify-between gap-2 px-4 py-4 min-[360px]:flex-row min-[360px]:items-center sm:px-6"><Link href={`/order/${flight.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="h-4 w-4" /> Flight menu</Link><Badge tone="neutral">Live updates</Badge></div></header>
      <main className="mx-auto max-w-2xl px-4 py-7 sm:px-6 sm:py-10">
        <Card><CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-primary-strong">{flight.airline} · {flight.flightNumber}</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">Meal for seat {order.seat}</h1><p className="mt-2 text-sm text-muted-foreground">Order {order.id} · Updated {formatTime(order.updatedAt)}</p></div><OrderStatusBadge status={order.status} /></div>

          <div className="mt-6 flex gap-4 rounded-xl bg-surface p-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary font-bold">{item.symbol}</span><div><p className="font-semibold">{item.name}</p>{originalItem && <p className="mt-1 text-xs text-muted-foreground">Replaces {originalItem.name}</p>}<p className="mt-1 text-sm text-muted-foreground">{order.serviceWindow} · {formatCurrency(order.amount)} paid</p></div></div>

          {flight.serviceStatus === "paused" && !isComplete && <Alert className="mt-5 border-warning/25 bg-warning-soft p-4 text-warning-strong"><Clock3 className="size-5" /><AlertTitle>Cabin service is temporarily paused</AlertTitle><AlertDescription className="text-warning-strong">Your meal remains reserved and will return to the queue when service resumes.</AlertDescription></Alert>}
          {mutationError && <Alert variant="destructive" className="mt-5 p-4"><RefreshCw className="size-5" /><AlertTitle>Resolution did not complete</AlertTitle><AlertDescription>{mutationError}</AlertDescription></Alert>}

          {order.status === "action_required" && (
            <div className="mt-6" aria-live="assertive">
              <Alert variant="destructive" className="p-4"><RefreshCw className="size-5" /><AlertTitle>Your selected meal is unavailable</AlertTitle><AlertDescription>Crew reported an onboard stock issue. We will not change your meal without your approval.</AlertDescription></Alert>

              <h2 className="mt-6 text-lg font-semibold">Choose what works for you</h2>
              <p className="mt-1 text-sm text-muted-foreground">The options below respect the dietary labels on your original meal and protect final stock.</p>
              {substitutes.length > 0 && <div className="mt-4 space-y-3">{substitutes.map((substitute) => {
                const stock = state.inventory.find((entry) => entry.flightId === order.flightId && entry.itemId === substitute.id)!;
                return <div key={substitute.id} className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-bold">{substitute.symbol}</span><div><p className="font-semibold">{substitute.name}</p><p className="mt-1 text-xs text-muted-foreground">{substitute.dietary.join(" · ")} · {stock.loaded - stock.reserved} available</p></div></div><Button data-testid={`substitute-${substitute.id}`} disabled={mutating} onClick={() => chooseSubstitute(order.flightId, order.id, substitute.id)}>Approve substitute</Button></div>;
              })}</div>}

              <div className="mt-4 flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary"><CircleDollarSign className="h-5 w-5" /></span><div><p className="font-semibold">Receive a simulated refund</p><p className="mt-1 text-xs text-muted-foreground">{formatCurrency(order.amount)} · {refundPolicy.automatic ? "Eligible for automatic completion" : "Operator approval needed"}</p></div></div><RefundDialog amount={order.amount} disabled={mutating} onConfirm={async () => setRefundReference(await refundOrder(order.flightId, order.id))} /></div>
            </div>
          )}

          {order.status === "substituted" && <ResolutionMessage icon={Utensils} title="Substitute approved" detail={`${item.name} is reserved and the crew queue has been updated.`} />}
          {order.status === "refunded" && <ResolutionMessage icon={CircleDollarSign} title="Simulated refund complete" detail={`${refundReference || `RF-${order.id.slice(-4)}`} confirms a ${formatCurrency(order.amount)} mock refund. No real payment was processed.`} />}
          {order.status === "delivered" && <ResolutionMessage icon={Check} title="Meal delivered" detail={`Crew confirmed delivery to seat ${order.seat}. Enjoy your flight.`} />}
          {order.status === "confirmed" && <ResolutionMessage icon={ShieldCheck} title="Meal reserved" detail={`Seat ${order.seat} · ${order.serviceWindow} · Your order remains reserved if service is temporarily paused.`} neutral />}

          <div className="mt-7 border-t border-border pt-5"><h2 className="text-sm font-semibold">Order progress</h2><ol className="mt-4 space-y-4"><ProgressStep complete title="Payment simulated" detail={formatCurrency(order.amount)} /><ProgressStep complete title="Meal reserved" detail={item.name} /><ProgressStep complete={order.status === "delivered"} current={!isComplete} title={order.status === "refunded" ? "Resolution" : "Cabin delivery"} detail={order.status === "refunded" ? "Refund completed" : order.status === "action_required" ? "Waiting for your choice" : flight.serviceStatus === "paused" ? "Service paused" : order.status === "delivered" ? "Delivered" : "In the crew queue"} /></ol></div>
        </CardContent></Card>
      </main>
    </div>
  );
}

function RefundDialog({ amount, disabled, onConfirm }: { amount: number; disabled: boolean; onConfirm: () => Promise<void> }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={disabled}>Choose refund</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm simulated refund</AlertDialogTitle><AlertDialogDescription>A mock refund of {formatCurrency(amount)} will be completed automatically under the operator’s under-S$20 policy. Your meal reservation will be released.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep my options</AlertDialogCancel><AlertDialogAction onClick={() => void onConfirm()}>Complete mock refund</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function ResolutionMessage({ icon: Icon, title, detail, neutral = false }: { icon: typeof Check; title: string; detail: string; neutral?: boolean }) {
  return <div className={`mt-6 flex gap-3 rounded-lg p-4 ${neutral ? "bg-primary-soft text-primary-strong" : "bg-success-soft text-success-strong"}`} aria-live="polite"><Icon className="h-5 w-5 shrink-0" /><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-5">{detail}</p></div></div>;
}

function ProgressStep({ complete = false, current = false, title, detail }: { complete?: boolean; current?: boolean; title: string; detail: string }) {
  return <li className="flex gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${complete ? "bg-success text-white" : current ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>{complete ? <Check className="h-3.5 w-3.5" /> : "•"}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></li>;
}
