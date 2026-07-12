"use client";

import Link from "next/link";
import { AlertTriangle, Check, CirclePause, CirclePlay, ExternalLink, PackageX, Plane, Utensils } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { OrderStatusBadge } from "@/components/status-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@/lib/types";

const sections: Order["section"][] = ["Forward cabin", "Mid cabin", "Aft cabin"];

export function CrewBoard({ flightId }: { flightId: string }) {
  const { state, mutating, mutationError, startService, pauseService, markItemUnavailable, markOrderDelivered } = useDemo();
  const flight = state.flights.find((entry) => entry.id === flightId);
  const flightInventory = state.inventory.filter((row) => row.flightId === flightId);
  const activeOrders = state.orders.filter((order) => order.flightId === flightId && order.status !== "refunded");
  const unresolved = activeOrders.filter((order) => order.status === "action_required").length;

  if (!flight) return <div className="p-8">Flight not found.</div>;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
          <div className="min-w-0"><Link href="/operator" className="inline-flex min-h-11 items-center text-sm font-bold tracking-[-0.02em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Gate2Tray <span className="font-normal text-muted-foreground">· Crew</span></Link><p className="break-words text-xs text-muted-foreground">{flight.flightNumber} · {flight.origin} to {flight.destination}</p></div>
          <Badge tone={flight.serviceStatus === "paused" ? "danger" : flight.serviceStatus === "active" ? "success" : "neutral"}>{flight.serviceStatus === "active" ? "Service active" : flight.serviceStatus === "paused" ? "Service paused" : "Ready to start"}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7 md:pb-12">
        <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="flex items-center gap-2 text-sm font-semibold text-primary-strong"><Plane className="h-4 w-4" /> Cabin fulfillment</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">Meal service queue</h1><p className="mt-2 text-sm text-muted-foreground">{activeOrders.filter((order) => order.status !== "delivered").length} orders · {flightInventory.reduce((total, row) => total + row.loaded - row.reserved, 0)} meals remaining</p></div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button size="lg" onClick={() => startService(flightId)} disabled={mutating || flight.serviceStatus === "active"}><CirclePlay className="h-5 w-5" /> Start service</Button>
            <Button size="lg" variant={flight.serviceStatus === "paused" ? "destructive" : "outline"} onClick={() => pauseService(flightId)} disabled={mutating || flight.serviceStatus === "paused"}><CirclePause className="h-5 w-5" /> Pause service</Button>
          </div>
        </section>

        {flight.serviceStatus === "paused" && <Alert variant="destructive" className="mt-5 p-4"><AlertTriangle className="size-5" /><AlertTitle>Service pause overrides the queue</AlertTitle><AlertDescription>Do not fulfill orders until service resumes. All passenger reservations remain protected.</AlertDescription></Alert>}
        {unresolved > 0 && <Alert className="mt-5 border-warning/25 bg-warning-soft p-4 text-warning-strong" role="status"><PackageX className="size-5" /><AlertTitle>{unresolved} {unresolved === 1 ? "order needs" : "orders need"} a passenger choice</AlertTitle><AlertDescription className="text-warning-strong">Do not substitute these meals until the passenger approves an option.</AlertDescription></Alert>}
        {mutationError && <Alert variant="destructive" className="mt-5 p-4"><AlertTriangle className="size-5" /><AlertTitle>Crew action did not complete</AlertTitle><AlertDescription>{mutationError}</AlertDescription></Alert>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Accordion type="multiple" defaultValue={sections} className="space-y-4">
            {sections.map((section) => {
              const orders = activeOrders.filter((order) => order.section === section && order.status !== "delivered");
              return (
                <AccordionItem key={section} value={section} className="border-0">
                  <Card>
                    <AccordionTrigger className="min-h-14 px-4 text-base hover:no-underline sm:px-5"><span className="flex flex-1 items-center justify-between gap-3 pr-3"><span className="font-semibold">{section}</span><Badge tone={orders.length ? "primary" : "neutral"}>{orders.length} waiting</Badge></span></AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                    {orders.length === 0 ? <div className="rounded-lg bg-surface p-5 text-center"><Check className="mx-auto h-5 w-5 text-success" /><p className="mt-2 text-sm font-semibold">Section clear</p><p className="mt-1 text-xs text-muted-foreground">No meals waiting here.</p></div> : (
                      <div className="divide-y divide-border">
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
                                  <UnavailableDialog itemName={item.name} disabled={mutating} onConfirm={() => markItemUnavailable(flightId, item.id)} />
                                  <Button onClick={() => markOrderDelivered(flightId, order.id)} disabled={mutating || flight.serviceStatus !== "active"}><Check className="h-4 w-4" /> Delivered</Button>
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                      </div>
                    )}
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5 text-primary-strong" />Remaining inventory</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border">
              {state.menuItems.map((item) => {
                const row = flightInventory.find((entry) => entry.itemId === item.id)!;
                const remaining = row.loaded - row.reserved;
                return <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium leading-5">{item.name}</p>{row.unavailable && <p className="mt-0.5 text-xs font-semibold text-danger-strong">Unavailable</p>}</div><span className="text-lg font-semibold tabular-nums">{remaining}</span></div>;
              })}
            </CardContent>
          </Card>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <Button size="lg" onClick={() => startService(flightId)} disabled={mutating || flight.serviceStatus === "active"}><CirclePlay className="h-5 w-5" /> Start</Button>
        <Button size="lg" variant={flight.serviceStatus === "paused" ? "destructive" : "outline"} onClick={() => pauseService(flightId)} disabled={mutating || flight.serviceStatus === "paused"}><CirclePause className="h-5 w-5" /> Pause</Button>
      </div>
    </div>
  );
}

function UnavailableDialog({ itemName, disabled, onConfirm }: { itemName: string; disabled: boolean; onConfirm: () => void }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={disabled}><PackageX className="h-4 w-4" /> Unavailable</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Mark {itemName} unavailable?</AlertDialogTitle><AlertDialogDescription>Every undelivered order for this meal will pause and ask the passenger to choose an approved substitute or simulated refund. No meal will be substituted automatically.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep available</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onConfirm}>Mark unavailable</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
