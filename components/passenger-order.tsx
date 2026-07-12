"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Clock3, PlaneTakeoff, ShieldCheck, ShoppingBag } from "lucide-react";
import { ZodError } from "zod";
import { BrandMark } from "@/components/brand-mark";
import { useDemo } from "@/components/demo-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutSchema } from "@/lib/schemas";
import type { ServiceWindow } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function PassengerOrder({ flightId }: { flightId: string }) {
  const { state, placeOrder } = useDemo();
  const [selectedItemId, setSelectedItemId] = useState("lemak");
  const [seat, setSeat] = useState("");
  const [serviceWindow, setServiceWindow] = useState<ServiceWindow>("Main service");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ id: string; seat: string; amount: number; itemName: string } | null>(null);

  const selectedItem = state.menuItems.find((item) => item.id === selectedItemId);
  const selectedInventory = state.inventory.find((row) => row.itemId === selectedItemId);
  const amount = selectedItem ? Number((selectedItem.price * (1 - state.flight.currentDiscount / 100)).toFixed(2)) : 0;
  const available = selectedInventory ? selectedInventory.loaded - selectedInventory.reserved : 0;

  const serviceMessage = state.flight.serviceStatus === "paused" ? "Cabin service is temporarily paused. Your meal will remain reserved." : "Your meal stays reserved even if cabin service is briefly paused.";

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

  if (flightId !== state.flight.id) {
    return <SimpleMessage title="Flight menu not found" detail="This ordering link is not active. Ask your crew for the current QR code." />;
  }

  if (confirmation) {
    return (
      <main className="min-h-screen bg-surface px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-lg rounded-xl bg-background p-6 shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)] sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-success text-white"><Check className="h-6 w-6" /></span>
          <Badge tone="success" className="mt-6">Payment simulated · Reserved</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Your meal is reserved</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">We’ve added it to the crew’s live service queue for MC201.</p>

          <dl className="mt-6 divide-y divide-border rounded-xl bg-surface px-4">
            <ConfirmationRow label="Meal" value={confirmation.itemName} />
            <ConfirmationRow label="Seat" value={confirmation.seat} />
            <ConfirmationRow label="Service" value={serviceWindow} />
            <ConfirmationRow label="Paid" value={formatCurrency(confirmation.amount)} />
            <ConfirmationRow label="Order" value={confirmation.id} />
          </dl>
          <div className="mt-5 flex gap-3 rounded-lg bg-success-soft p-3 text-sm leading-5 text-success-strong"><ShieldCheck className="h-5 w-5 shrink-0" />{serviceMessage}</div>
          <Button asChild size="lg" className="mt-6 w-full"><Link href={`/track/${confirmation.id}`}>Track my meal <ChevronRight className="h-4 w-4" /></Link></Button>
          <Button variant="ghost" className="mt-2 w-full" onClick={() => setConfirmation(null)}>Order another meal</Button>
        </div>
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

      <main className="mx-auto max-w-5xl px-4 pb-36 pt-6 sm:px-6 sm:pt-8">
        <Link href="/operator" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="h-4 w-4" /> Operator demo</Link>
        <section className="mt-3 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-strong">{state.flight.airline} · {state.flight.flightNumber}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Choose your meal to Langkawi</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><PlaneTakeoff className="h-4 w-4" /> {state.flight.origin} → {state.flight.destination}</p>
          </div>
          {state.flight.currentDiscount > 0 && <div className="rounded-lg bg-primary-soft px-4 py-3"><p className="text-xs font-semibold text-primary-strong">Gate offer applied</p><p className="mt-0.5 text-lg font-bold text-primary-strong">{state.flight.currentDiscount}% off all meals</p></div>}
        </section>

        {state.flight.serviceStatus === "paused" && (
          <div className="mt-5 flex gap-3 rounded-lg bg-warning-soft p-4 text-sm text-warning-strong" role="status"><Clock3 className="h-5 w-5 shrink-0" /><span><strong>Service temporarily paused.</strong> You can still reserve a meal; crew delivery will resume when conditions allow.</span></div>
        )}

        <form onSubmit={checkout} className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section>
            <div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold">Available on MC201</h2><p className="mt-1 text-sm text-muted-foreground">Stock is reserved when checkout completes.</p></div><p className="text-xs text-muted-foreground">Four choices</p></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {sortedItems.map((item) => {
                const row = state.inventory.find((entry) => entry.itemId === item.id)!;
                const remaining = row.loaded - row.reserved;
                const disabled = row.unavailable || remaining <= 2;
                const selected = selectedItemId === item.id;
                const discounted = item.price * (1 - state.flight.currentDiscount / 100);
                return (
                  <button key={item.id} type="button" disabled={disabled} onClick={() => setSelectedItemId(item.id)} aria-pressed={selected} className={cn("min-h-[220px] rounded-xl bg-background p-4 text-left transition-[box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-55", selected ? "ring-2 ring-primary" : "shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)] hover:bg-surface-elevated")}>
                    <div className="flex items-start justify-between gap-3"><span className={cn("grid h-12 w-12 place-items-center rounded-lg text-sm font-bold", selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{item.symbol}</span>{selected && <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" /></span>}</div>
                    <h3 className="mt-4 font-semibold leading-5">{item.name}</h3>
                    <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{item.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">{item.dietary.map((label) => <Badge key={label} tone="neutral">{label}</Badge>)}</div>
                    <div className="mt-4 flex items-end justify-between"><div>{state.flight.currentDiscount > 0 && <span className="mr-2 text-sm text-muted-foreground line-through">{formatCurrency(item.price)}</span>}<span className="font-semibold tabular-nums">{formatCurrency(discounted)}</span></div><span className={cn("text-xs font-semibold", remaining <= 4 ? "text-warning-strong" : "text-muted-foreground")}>{disabled ? "Unavailable" : `${remaining} left`}</span></div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="h-fit rounded-xl bg-background p-5 shadow-[0_2px_8px_oklch(0.2_0.02_330/0.08)] lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Reserve your meal</h2>
            <p className="mt-1 text-sm text-muted-foreground">No card is charged in this demo.</p>

            <label htmlFor="seat" className="mt-5 block text-sm font-semibold">Seat number</label>
            <Input id="seat" name="seat" value={seat} onChange={(event) => setSeat(event.target.value.toUpperCase())} placeholder="18A" autoComplete="off" className="mt-2" aria-describedby={error ? "checkout-error" : undefined} />

            <fieldset className="mt-5"><legend className="text-sm font-semibold">Service window</legend><div className="mt-2 space-y-2">
              {(["Main service", "After take-off"] as ServiceWindow[]).map((window) => (
                <label key={window} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm", serviceWindow === window ? "border-primary bg-primary-soft" : "border-border")}><input type="radio" name="service-window" value={window} checked={serviceWindow === window} onChange={() => setServiceWindow(window)} className="h-4 w-4 accent-[oklch(0.56_0.16_330)]" /><span className="font-medium">{window}</span></label>
              ))}
            </div></fieldset>

            <div className="mt-5 border-t border-border pt-4"><div className="flex justify-between text-sm"><span className="text-muted-foreground">{selectedItem?.name}</span><span className="font-semibold tabular-nums">{formatCurrency(amount)}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Available stock</span><span className="font-medium">{available} meals</span></div></div>
            {error && <p id="checkout-error" className="mt-4 rounded-lg bg-danger-soft p-3 text-sm font-medium text-danger-strong" role="alert">{error}</p>}
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={!selectedItem || available <= 2}><ShoppingBag className="h-4 w-4" /> Simulate checkout · {formatCurrency(amount)}</Button>
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Secure demo checkout · No real payment provider</p>
          </aside>
        </form>
      </main>
    </div>
  );
}

function ConfirmationRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold tabular-nums">{value}</dd></div>;
}

function SimpleMessage({ title, detail }: { title: string; detail: string }) {
  return <main className="grid min-h-screen place-items-center bg-surface p-4"><div className="max-w-md rounded-xl bg-background p-6 text-center"><h1 className="text-xl font-semibold">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p><Button asChild className="mt-5"><Link href="/operator">Back to operator</Link></Button></div></main>;
}
