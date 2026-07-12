import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoState, mutateDemoState } from "@/lib/sqlite";
import type { DemoCommand } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("run_agent"), flightId: z.string().min(1) }),
  z.object({ type: z.literal("approve_discount"), flightId: z.string().min(1) }),
  z.object({ type: z.literal("place_order"), flightId: z.string().min(1), payload: z.object({ itemId: z.string(), seat: z.string(), serviceWindow: z.enum(["Main service", "After take-off"]) }) }),
  z.object({ type: z.literal("start_service"), flightId: z.string().min(1) }),
  z.object({ type: z.literal("pause_service"), flightId: z.string().min(1) }),
  z.object({ type: z.literal("mark_item_unavailable"), flightId: z.string().min(1), payload: z.object({ itemId: z.string() }) }),
  z.object({ type: z.literal("mark_order_delivered"), flightId: z.string().min(1), payload: z.object({ orderId: z.string() }) }),
  z.object({ type: z.literal("choose_substitute"), flightId: z.string().min(1), payload: z.object({ orderId: z.string(), itemId: z.string() }) }),
  z.object({ type: z.literal("refund_order"), flightId: z.string().min(1), payload: z.object({ orderId: z.string() }) }),
  z.object({ type: z.literal("reset_demo") }),
]);

export async function GET() {
  return NextResponse.json({ state: getDemoState() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestOrigin) || fetchSite === "cross-site") {
    return NextResponse.json({ error: "Cross-site mutation requests are not allowed." }, { status: 403 });
  }

  try {
    const command = commandSchema.parse(await request.json()) as DemoCommand;
    return NextResponse.json(mutateDemoState(command));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the demo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
