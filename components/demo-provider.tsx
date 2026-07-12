"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { freshDemoState } from "@/lib/mock-data";
import type { DemoCommand, DemoState, ServiceWindow } from "@/lib/types";

type DemoContextValue = {
  state: DemoState;
  hydrated: boolean;
  runAgent: () => Promise<void>;
  approveDiscount: () => Promise<void>;
  placeOrder: (input: { itemId: string; seat: string; serviceWindow: ServiceWindow }) => Promise<string>;
  startService: () => Promise<void>;
  pauseService: () => Promise<void>;
  markItemUnavailable: (itemId: string) => Promise<void>;
  markOrderDelivered: (orderId: string) => Promise<void>;
  chooseSubstitute: (orderId: string, itemId: string) => Promise<void>;
  refundOrder: (orderId: string) => Promise<string>;
  resetDemo: () => Promise<void>;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => freshDemoState());
  const [hydrated, setHydrated] = useState(false);
  const mutationVersion = useRef(0);

  const refresh = useCallback(async () => {
    const versionAtStart = mutationVersion.current;
    const response = await fetch("/api/demo", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load live demo state.");
    const data = await response.json() as { state: DemoState };
    if (versionAtStart === mutationVersion.current) setState(data.state);
    setHydrated(true);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 1400);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const send = useCallback(async (command: DemoCommand) => {
    mutationVersion.current += 1;
    const response = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });
    const data = await response.json() as { state?: DemoState; result?: string; error?: string };
    if (!response.ok || !data.state) throw new Error(data.error ?? "Unable to update the demo.");
    setState(data.state);
    return data.result;
  }, []);

  const runAgent = useCallback(async () => { await send({ type: "run_agent" }); }, [send]);
  const approveDiscount = useCallback(async () => { await send({ type: "approve_discount" }); }, [send]);
  const placeOrder = useCallback(async (payload: { itemId: string; seat: string; serviceWindow: ServiceWindow }) => {
    const result = await send({ type: "place_order", payload });
    if (!result) throw new Error("Order reference was not created.");
    return result;
  }, [send]);
  const startService = useCallback(async () => { await send({ type: "start_service" }); }, [send]);
  const pauseService = useCallback(async () => { await send({ type: "pause_service" }); }, [send]);
  const markItemUnavailable = useCallback(async (itemId: string) => { await send({ type: "mark_item_unavailable", payload: { itemId } }); }, [send]);
  const markOrderDelivered = useCallback(async (orderId: string) => { await send({ type: "mark_order_delivered", payload: { orderId } }); }, [send]);
  const chooseSubstitute = useCallback(async (orderId: string, itemId: string) => { await send({ type: "choose_substitute", payload: { orderId, itemId } }); }, [send]);
  const refundOrder = useCallback(async (orderId: string) => {
    const result = await send({ type: "refund_order", payload: { orderId } });
    if (!result) throw new Error("Refund reference was not created.");
    return result;
  }, [send]);
  const resetDemo = useCallback(async () => { await send({ type: "reset_demo" }); }, [send]);

  const value = useMemo(() => ({ state, hydrated, runAgent, approveDiscount, placeOrder, startService, pauseService, markItemUnavailable, markOrderDelivered, chooseSubstitute, refundOrder, resetDemo }), [state, hydrated, runAgent, approveDiscount, placeOrder, startService, pauseService, markItemUnavailable, markOrderDelivered, chooseSubstitute, refundOrder, resetDemo]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
