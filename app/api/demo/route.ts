import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoState, mutateDemoState } from "@/lib/sqlite";
import type { DemoCommand } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("run_agent") }),
  z.object({ type: z.literal("approve_discount") }),
  z.object({ type: z.literal("place_order"), payload: z.object({ itemId: z.string(), seat: z.string(), serviceWindow: z.enum(["Main service", "After take-off"]) }) }),
  z.object({ type: z.literal("start_service") }),
  z.object({ type: z.literal("pause_service") }),
  z.object({ type: z.literal("mark_item_unavailable"), payload: z.object({ itemId: z.string() }) }),
  z.object({ type: z.literal("mark_order_delivered"), payload: z.object({ orderId: z.string() }) }),
  z.object({ type: z.literal("choose_substitute"), payload: z.object({ orderId: z.string(), itemId: z.string() }) }),
  z.object({ type: z.literal("refund_order"), payload: z.object({ orderId: z.string() }) }),
  z.object({ type: z.literal("reset_demo") }),
]);

export async function GET() {
  return NextResponse.json({ state: getDemoState() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const command = commandSchema.parse(await request.json()) as DemoCommand;
    return NextResponse.json(mutateDemoState(command));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the demo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
