"use client";

import Link from "next/link";
import { AlertTriangle, Check, CirclePause, CirclePlay, ExternalLink, PackageX, Plane, Utensils } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { OrderStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Order } from "@/lib/types";

const sections: Order["section"][] = ["Forward cabin", "Mid cabin", "Aft cabin"];

export function CrewBoard({ flightId }: { flightId: string }) {
  const { state, startService, pauseService, markItemUnavailable, markOrderDelivered } = useDemo();
  const activeOrders = state.orders.filter((order) => order.status !== "refunded");
  const unresolved = activeOrders.filter((order) => order.status === "action_required").length;

  if (flightId !== state.flight.id) return <div className="p-8">Flight not found.</div>;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div><Link href="/operator" className="inline-flex min-h-11 items-center text-sm font-bold tracking-[-0.02em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Gate2Tray <span className="font-normal text-muted-foreground">· Crew</span></Link><p className="text-xs text-muted-foreground">{state.flight.flightNumber} · {state.flight.origin} to {state.flight.destination}</p></div>
          <Badge tone={state.flight.serviceStatus === "paused" ? "danger" : state.flight.serviceStatus === "active" ? "success" : "neutral"}>{state.flight.serviceStatus === "active" ? "Service active" : state.flight.serviceStatus === "paused" ? "Service paused" : "Ready to start"}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pt-7">
        <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="flex items-center gap-2 text-sm font-semibold text-primary-strong"><Plane className="h-4 w-4" /> Cabin fulfillment</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">Meal service queue</h1><p className="mt-2 text-sm text-muted-foreground">{activeOrders.length} orders · {state.inventory.reduce((total, row) => total + row.loaded - row.reserved, 0)} meals remaining</p></div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button size="lg" onClick={startService} disabled={state.flight.serviceStatus === "active"}><CirclePlay className="h-5 w-5" /> Start service</Button>
            <Button size="lg" variant={state.flight.serviceStatus === "paused" ? "destructive" : "outline"} onClick={pauseService} disabled={state.flight.serviceStatus === "paused"}><CirclePause className="h-5 w-5" /> Pause service</Button>
          </div>
        </section>

        {state.flight.serviceStatus === "paused" && <div className="mt-5 flex gap-3 rounded-xl bg-danger-soft p-4 text-danger-strong" role="alert"><AlertTriangle className="h-6 w-6 shrink-0" /><div><p className="font-semibold">Service pause overrides the queue</p><p className="mt-1 text-sm">Do not fulfill orders until service resumes. All passenger reservations remain protected.</p></div></div>}
        {unresolved > 0 && <div className="mt-5 flex gap-3 rounded-xl bg-warning-soft p-4 text-warning-strong" role="status"><PackageX className="h-6 w-6 shrink-0" /><div><p className="font-semibold">{unresolved} {unresolved === 1 ? "order needs" : "orders need"} a passenger choice</p><p className="mt-1 text-sm">Do not substitute these meals until the passenger approves an option.</p></div></div>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            {sections.map((section) => {
              const orders = activeOrders.filter((order) => order.section === section && order.status !== "delivered");
              return (
                <section key={section} className="rounded-xl bg-background p-4 shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)] sm:p-5">
                  <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{section}</h2><Badge tone={orders.length ? "primary" : "neutral"}>{orders.length} waiting</Badge></div>
                  {orders.length === 0 ? <div className="mt-4 rounded-lg bg-surface p-5 text-center"><Check className="mx-auto h-5 w-5 text-success" /><p className="mt-2 text-sm font-semibold">Section clear</p><p className="mt-1 text-xs text-muted-foreground">No meals waiting here.</p></div> : (
                    <div className="mt-4 divide-y divide-border">
                      {orders.map((order) => {
                        const item = state.menuItems.find((entry) => entry.id === order.itemId)!;
                        return (
                          <article key={order.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex items-start gap-3">
                              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary text-base font-bold tabular-nums">{order.seat}</span>
                              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.name}</h3><OrderStatusBadge status={order.status} /></div><p className="mt-1 text-sm text-muted-foreground">{order.serviceWindow} · {order.id}</p></div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                              {order.status === "action_required" ? <Button variant="outline" asChild className="col-span-2 sm:col-span-1"><Link href={`/track/${order.id}`} target="_blank">Open passenger choice <ExternalLink className="h-4 w-4" /></Link></Button> : (
                                <>
                                  <UnavailableDialog itemName={item.name} onConfirm={() => markItemUnavailable(item.id)} />
                                  <Button onClick={() => markOrderDelivered(order.id)} disabled={state.flight.serviceStatus !== "active"}><Check className="h-4 w-4" /> Delivered</Button>
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <aside className="h-fit rounded-xl bg-background p-5 shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)] lg:sticky lg:top-6">
            <div className="flex items-center gap-2"><Utensils className="h-5 w-5 text-primary-strong" /><h2 className="font-semibold">Remaining inventory</h2></div>
            <div className="mt-4 divide-y divide-border">
              {state.menuItems.map((item) => {
                const row = state.inventory.find((entry) => entry.itemId === item.id)!;
                const remaining = row.loaded - row.reserved;
                return <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium leading-5">{item.name}</p>{row.unavailable && <p className="mt-0.5 text-xs font-semibold text-danger-strong">Unavailable</p>}</div><span className="text-lg font-semibold tabular-nums">{remaining}</span></div>;
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function UnavailableDialog({ itemName, onConfirm }: { itemName: string; onConfirm: () => void }) {
  return <Dialog><DialogTrigger asChild><Button variant="outline"><PackageX className="h-4 w-4" /> Unavailable</Button></DialogTrigger><DialogContent><DialogTitle>Mark {itemName} unavailable?</DialogTitle><DialogDescription>Every undelivered order for this meal will pause and ask the passenger to choose an approved substitute or simulated refund. No meal will be substituted automatically.</DialogDescription><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><DialogClose asChild><Button variant="outline">Keep available</Button></DialogClose><DialogClose asChild><Button variant="destructive" onClick={onConfirm}>Mark unavailable</Button></DialogClose></div></DialogContent></Dialog>;
}
