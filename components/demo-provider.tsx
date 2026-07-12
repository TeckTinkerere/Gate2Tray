"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { freshDemoState } from "@/lib/mock-data";
import type { DemoCommand, DemoState, ServiceWindow } from "@/lib/types";

type DemoContextValue = {
  state: DemoState;
  hydrated: boolean;
  connectionStatus: "connecting" | "live" | "reconnecting" | "offline";
  lastUpdatedAt: string | null;
  mutating: boolean;
  mutationError: string;
  runAgent: (flightId: string) => Promise<void>;
  approveDiscount: (flightId: string) => Promise<void>;
  placeOrder: (flightId: string, input: { itemId: string; seat: string; serviceWindow: ServiceWindow }) => Promise<string>;
  startService: (flightId: string) => Promise<void>;
  pauseService: (flightId: string) => Promise<void>;
  markItemUnavailable: (flightId: string, itemId: string) => Promise<void>;
  markOrderDelivered: (flightId: string, orderId: string) => Promise<void>;
  chooseSubstitute: (flightId: string, orderId: string, itemId: string) => Promise<void>;
  refundOrder: (flightId: string, orderId: string) => Promise<string>;
  resetDemo: () => Promise<void>;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => freshDemoState());
  const [hydrated, setHydrated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<DemoContextValue["connectionStatus"]>("connecting");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const mutationVersion = useRef(0);

  const refresh = useCallback(async () => {
    const versionAtStart = mutationVersion.current;
    try {
      const response = await fetch("/api/demo", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load live demo state.");
      const data = await response.json() as { state: DemoState };
      if (versionAtStart === mutationVersion.current) setState(data.state);
      setHydrated(true);
      setConnectionStatus("live");
      setLastUpdatedAt(new Date().toISOString());
    } catch {
      setConnectionStatus((current) => current === "connecting" ? "offline" : "reconnecting");
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 1400);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const send = useCallback(async (command: DemoCommand) => {
    mutationVersion.current += 1;
    setMutating(true);
    setMutationError("");
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      const data = await response.json() as { state?: DemoState; result?: string; error?: string };
      if (!response.ok || !data.state) throw new Error(data.error ?? "Unable to update the demo.");
      setState(data.state);
      setConnectionStatus("live");
      setLastUpdatedAt(new Date().toISOString());
      return data.result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update the demo.";
      setMutationError(message);
      setConnectionStatus("reconnecting");
      throw error;
    } finally {
      setMutating(false);
    }
  }, []);

  const runAgent = useCallback(async (flightId: string) => { await send({ type: "run_agent", flightId }); }, [send]);
  const approveDiscount = useCallback(async (flightId: string) => { await send({ type: "approve_discount", flightId }); }, [send]);
  const placeOrder = useCallback(async (flightId: string, payload: { itemId: string; seat: string; serviceWindow: ServiceWindow }) => {
    const result = await send({ type: "place_order", flightId, payload });
    if (!result) throw new Error("Order reference was not created.");
    return result;
  }, [send]);
  const startService = useCallback(async (flightId: string) => { await send({ type: "start_service", flightId }); }, [send]);
  const pauseService = useCallback(async (flightId: string) => { await send({ type: "pause_service", flightId }); }, [send]);
  const markItemUnavailable = useCallback(async (flightId: string, itemId: string) => { await send({ type: "mark_item_unavailable", flightId, payload: { itemId } }); }, [send]);
  const markOrderDelivered = useCallback(async (flightId: string, orderId: string) => { await send({ type: "mark_order_delivered", flightId, payload: { orderId } }); }, [send]);
  const chooseSubstitute = useCallback(async (flightId: string, orderId: string, itemId: string) => { await send({ type: "choose_substitute", flightId, payload: { orderId, itemId } }); }, [send]);
  const refundOrder = useCallback(async (flightId: string, orderId: string) => {
    const result = await send({ type: "refund_order", flightId, payload: { orderId } });
    if (!result) throw new Error("Refund reference was not created.");
    return result;
  }, [send]);
  const resetDemo = useCallback(async () => { await send({ type: "reset_demo" }); }, [send]);

  const value = useMemo(() => ({ state, hydrated, connectionStatus, lastUpdatedAt, mutating, mutationError, runAgent, approveDiscount, placeOrder, startService, pauseService, markItemUnavailable, markOrderDelivered, chooseSubstitute, refundOrder, resetDemo }), [state, hydrated, connectionStatus, lastUpdatedAt, mutating, mutationError, runAgent, approveDiscount, placeOrder, startService, pauseService, markItemUnavailable, markOrderDelivered, chooseSubstitute, refundOrder, resetDemo]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
