"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Clock3, PlaneTakeoff, ShieldCheck, ShoppingBag } from "lucide-react";
import { ZodError } from "zod";
import { BrandMark } from "@/components/brand-mark";
import { useDemo } from "@/components/demo-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { checkoutSchema } from "@/lib/schemas";
import type { ServiceWindow } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function PassengerOrder({ flightId }: { flightId: string }) {
  const { state, mutating, placeOrder } = useDemo();
  const [selectedItemId, setSelectedItemId] = useState("lemak");
  const [seat, setSeat] = useState("");
  const [serviceWindow, setServiceWindow] = useState<ServiceWindow>("Main service");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ id: string; seat: string; amount: number; itemName: string } | null>(null);

  const flight = state.flights.find((entry) => entry.id === flightId);
  const selectedItem = state.menuItems.find((item) => item.id === selectedItemId);
  const selectedInventory = state.inventory.find((row) => row.flightId === flightId && row.itemId === selectedItemId);
  const amount = selectedItem ? Number((selectedItem.price * (1 - (flight?.currentDiscount ?? 0) / 100)).toFixed(2)) : 0;
  const available = selectedInventory ? selectedInventory.loaded - selectedInventory.reserved : 0;

  const serviceMessage = flight?.serviceStatus === "paused" ? "Cabin service is temporarily paused. Your meal will remain reserved." : "Your meal stays reserved even if cabin service is briefly paused.";

  const sortedItems = useMemo(() => [...state.menuItems].sort((a, b) => (a.id === "lemak" ? -1 : b.id === "lemak" ? 1 : 0)), [state.menuItems]);

  async function checkout(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const parsed = checkoutSchema.parse({ itemId: selectedItemId, seat, serviceWindow });
      const id = await placeOrder(flightId, parsed);
      setConfirmation({ id, seat: parsed.seat, amount, itemName: selectedItem?.name ?? "Meal" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (checkoutError) {
      if (checkoutError instanceof ZodError) setError(checkoutError.issues[0]?.message ?? "Check your order details.");
      else setError(checkoutError instanceof Error ? checkoutError.message : "Unable to reserve this meal.");
    }
  }

  if (!flight) {
    return <SimpleMessage title="Flight menu not found" detail="This ordering link is not active. Ask your crew for the current QR code." />;
  }

  if (confirmation) {
    return (
      <main className="min-h-screen bg-surface px-4 py-8 sm:py-12">
        <Card className="mx-auto max-w-lg">
          <CardHeader className="px-6 pt-2 sm:px-8">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-success text-white"><Check className="h-6 w-6" /></span>
            <Badge tone="success" className="mt-4 w-fit">Payment simulated · Reserved</Badge>
            <CardTitle className="mt-2 text-2xl">Your meal is reserved</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">We’ve added it to the crew’s live service queue for {flight.flightNumber}.</p>
          </CardHeader>
          <CardContent className="px-6 pb-2 sm:px-8">
            <dl className="divide-y divide-border rounded-xl bg-surface px-4">
              <ConfirmationRow label="Meal" value={confirmation.itemName} />
              <ConfirmationRow label="Seat" value={confirmation.seat} />
              <ConfirmationRow label="Service" value={serviceWindow} />
              <ConfirmationRow label="Paid" value={formatCurrency(confirmation.amount)} />
              <ConfirmationRow label="Order" value={confirmation.id} />
            </dl>
            <Alert className="mt-5 border-success/25 bg-success-soft p-3 text-success-strong"><ShieldCheck className="size-5" /><AlertTitle>Reservation protected</AlertTitle><AlertDescription className="text-success-strong">{serviceMessage}</AlertDescription></Alert>
            <Button asChild size="lg" className="mt-6 w-full"><Link href={`/track/${confirmation.id}`}>Track my meal <ChevronRight className="h-4 w-4" /></Link></Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => setConfirmation(null)}>Order another meal</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandMark />
          <Badge tone="success">Ordering open</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:pb-12">
        <Link href="/operator" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="h-4 w-4" /> Operator demo</Link>
        <section className="mt-3 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-strong">{flight.airline} · {flight.flightNumber}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Choose your meal to {flight.destination}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><PlaneTakeoff className="h-4 w-4" /> {flight.origin} → {flight.destination}</p>
          </div>
          {flight.currentDiscount > 0 && <div className="rounded-lg bg-primary-soft px-4 py-3"><p className="text-xs font-semibold text-primary-strong">Gate offer applied</p><p className="mt-0.5 text-lg font-bold text-primary-strong">{flight.currentDiscount}% off all meals</p></div>}
        </section>

        {flight.serviceStatus === "paused" && (
          <Alert className="mt-5 border-warning/25 bg-warning-soft p-4 text-warning-strong" role="status"><Clock3 className="size-5" /><AlertTitle>Service temporarily paused</AlertTitle><AlertDescription className="text-warning-strong">You can still reserve a meal; crew delivery will resume when conditions allow.</AlertDescription></Alert>
        )}

        <form id="meal-checkout" onSubmit={checkout} className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section>
            <div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold">Available on {flight.flightNumber}</h2><p className="mt-1 text-sm text-muted-foreground">Stock is reserved when checkout completes.</p></div><p className="text-xs text-muted-foreground">Four choices</p></div>
            <RadioGroup value={selectedItemId} onValueChange={setSelectedItemId} className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Meal choice">
              {sortedItems.map((item) => {
                const row = state.inventory.find((entry) => entry.flightId === flightId && entry.itemId === item.id)!;
                const remaining = row.loaded - row.reserved;
                const disabled = row.unavailable || remaining <= 2;
                const selected = selectedItemId === item.id;
                const discounted = item.price * (1 - flight.currentDiscount / 100);
                return (
                  <div key={item.id} className="relative">
                    <RadioGroupItem id={`meal-${item.id}`} value={item.id} disabled={disabled} className="peer sr-only" />
                    <Label htmlFor={`meal-${item.id}`} className={cn("block h-full cursor-pointer rounded-xl peer-disabled:cursor-not-allowed peer-disabled:opacity-55", selected && "ring-2 ring-primary ring-offset-2")}>
                      <Card className="h-full min-h-[220px] transition-colors hover:bg-surface-elevated">
                        <CardContent className="flex h-full flex-col pt-1">
                          <div className="flex items-start justify-between gap-3"><span className={cn("grid h-12 w-12 place-items-center rounded-lg text-sm font-bold", selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{item.symbol}</span>{selected && <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" /></span>}</div>
                          <h3 className="mt-4 font-semibold leading-5">{item.name}</h3>
                          <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{item.description}</p>
                          <div className="mt-4 flex flex-wrap gap-1.5">{item.dietary.map((dietaryLabel) => <Badge key={dietaryLabel} tone="neutral">{dietaryLabel}</Badge>)}</div>
                          <div className="mt-auto flex items-end justify-between pt-4"><div>{flight.currentDiscount > 0 && <span className="mr-2 text-sm text-muted-foreground line-through">{formatCurrency(item.price)}</span>}<span className="font-semibold tabular-nums">{formatCurrency(discounted)}</span></div><span className={cn("text-xs font-semibold", remaining <= 4 ? "text-warning-strong" : "text-muted-foreground")}>{disabled ? "Unavailable" : `${remaining} left`}</span></div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </section>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader><CardTitle>Reserve your meal</CardTitle><p className="text-sm text-muted-foreground">No card is charged in this demo.</p></CardHeader>
            <CardContent>

            <Label htmlFor="seat" className="block">Seat number</Label>
            <Input id="seat" name="seat" value={seat} onChange={(event) => setSeat(event.target.value.toUpperCase())} placeholder="18A" autoComplete="off" className="mt-2" aria-describedby={error ? "checkout-error" : undefined} />

            <fieldset className="mt-5"><legend className="text-sm font-semibold">Service window</legend><RadioGroup value={serviceWindow} onValueChange={(value) => setServiceWindow(value as ServiceWindow)} className="mt-2">
              {(["Main service", "After take-off"] as ServiceWindow[]).map((window) => (
                <Label key={window} htmlFor={`service-${window}`} className={cn("flex min-h-12 cursor-pointer gap-3 rounded-lg border px-3 text-sm", serviceWindow === window ? "border-primary bg-primary-soft" : "border-border")}><RadioGroupItem id={`service-${window}`} value={window} /><span className="font-medium">{window}</span></Label>
              ))}
            </RadioGroup></fieldset>

            <div className="mt-5 border-t border-border pt-4"><div className="flex justify-between text-sm"><span className="text-muted-foreground">{selectedItem?.name}</span><span className="font-semibold tabular-nums">{formatCurrency(amount)}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Available stock</span><span className="font-medium">{available} meals</span></div></div>
            {error && <Alert id="checkout-error" variant="destructive" className="mt-4 p-3"><AlertTitle>Check your order</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={mutating || !selectedItem || available <= 2}><ShoppingBag className="h-4 w-4" /> {mutating ? "Reserving…" : `Simulate checkout · ${formatCurrency(amount)}`}</Button>
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Secure demo checkout · No real payment provider</p>
            </CardContent>
          </Card>
        </form>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{selectedItem?.name ?? "Choose a meal"}</p><p className="text-xs text-muted-foreground">{available} available · {formatCurrency(amount)}</p></div><Button type="submit" form="meal-checkout" disabled={mutating || !selectedItem || available <= 2}><ShoppingBag className="size-4" /> {mutating ? "Reserving…" : "Review & reserve"}</Button></div>
      </div>
    </div>
  );
}

function ConfirmationRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold tabular-nums">{value}</dd></div>;
}

function SimpleMessage({ title, detail }: { title: string; detail: string }) {
  return <main className="grid min-h-screen place-items-center bg-surface p-4"><div className="max-w-md rounded-xl bg-background p-6 text-center"><h1 className="text-xl font-semibold">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p><Button asChild className="mt-5"><Link href="/operator">Back to operator</Link></Button></div></main>;
}
