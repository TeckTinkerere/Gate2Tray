import { findApprovedSubstitutes, issueMockRefund, recommendDiscount } from "@/lib/agent-tools";
import { freshDemoState } from "@/lib/mock-data";
import { checkoutSchema } from "@/lib/schemas";
import type { AgentAction, DemoCommand, DemoState, Flight, Order } from "@/lib/types";

function createAction(flightId: string, type: AgentAction["type"], title: string, detail: string): AgentAction {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    flightId,
    type,
    title,
    detail,
    timestamp: new Date().toISOString(),
  };
}

function getFlight(state: DemoState, flightId: string): Flight {
  const flight = state.flights.find((entry) => entry.id === flightId);
  if (!flight) throw new Error("Flight not found.");
  return flight;
}

function updateFlight(state: DemoState, flightId: string, update: Partial<Flight>) {
  const flight = { ...getFlight(state, flightId), ...update };
  return {
    flight: state.flight.id === flightId ? flight : state.flight,
    flights: state.flights.map((entry) => entry.id === flightId ? flight : entry),
  };
}

function getFlightOrder(state: DemoState, flightId: string, orderId: string): Order {
  const order = state.orders.find((entry) => entry.id === orderId && entry.flightId === flightId);
  if (!order) throw new Error("Order not found for flight.");
  return order;
}

function getCabinSection(seat: string): "Forward cabin" | "Mid cabin" | "Aft cabin" {
  const row = Number.parseInt(seat, 10);
  if (row <= 10) return "Forward cabin";
  if (row <= 20) return "Mid cabin";
  return "Aft cabin";
}

export function executeDemoCommand(current: DemoState, command: DemoCommand): { state: DemoState; result?: string } {
  switch (command.type) {
    case "reset_demo":
      return { state: freshDemoState() };

    case "run_agent": {
      getFlight(current, command.flightId);
      const forecast = recommendDiscount(current, command.flightId);
      return {
        state: {
          ...current,
          forecast: command.flightId === current.flight.id ? forecast : current.forecast,
          forecasts: { ...current.forecasts, [command.flightId]: forecast },
          discountApproval: command.flightId === current.flight.id ? "pending" : current.discountApproval,
          discountApprovals: { ...current.discountApprovals, [command.flightId]: "pending" },
          agentActions: [
            createAction(command.flightId, "recommended", "Gate discount ready for approval", forecast.explanation),
            createAction(command.flightId, "observed", "Demand forecast completed", `Expected ${forecast.expectedOrders} meal orders at ${forecast.confidence}% confidence.`),
            ...current.agentActions,
          ],
        },
      };
    }

    case "approve_discount": {
      const forecast = current.forecasts[command.flightId];
      if (!forecast) return { state: current };
      const discount = forecast.recommendedDiscount;
      const flightUpdate = updateFlight(current, command.flightId, { currentDiscount: discount });
      return {
        state: {
          ...current,
          ...flightUpdate,
          discountApproval: command.flightId === current.flight.id ? "approved" : current.discountApproval,
          discountApprovals: { ...current.discountApprovals, [command.flightId]: "approved" },
          agentActions: [
            createAction(command.flightId, "executed", `${discount}% passenger discount published`, `Updated the ${command.flightId} ordering page and preserved the final two units of every meal.`),
            createAction(command.flightId, "approved", "Discount approved by operator", "Bounded recommendation approved within the 15% automatic-discount policy."),
            ...current.agentActions,
          ],
        },
      };
    }

    case "place_order": {
      const parsed = checkoutSchema.parse(command.payload);
      const flight = getFlight(current, command.flightId);
      const item = current.menuItems.find((entry) => entry.id === parsed.itemId);
      const inventory = current.inventory.find((row) => row.flightId === command.flightId && row.itemId === parsed.itemId);
      if (!item || !inventory || inventory.unavailable || inventory.loaded - inventory.reserved <= 2) {
        throw new Error("This meal is no longer available.");
      }
      const id = `G2T-${Math.floor(1000 + Math.random() * 9000)}`;
      const createdAt = new Date().toISOString();
      const amount = Number((item.price * (1 - flight.currentDiscount / 100)).toFixed(2));
      return {
        result: id,
        state: {
          ...current,
          inventory: current.inventory.map((row) => row.flightId === command.flightId && row.itemId === item.id ? { ...row, reserved: row.reserved + 1 } : row),
          orders: [...current.orders, {
            id,
            flightId: command.flightId,
            itemId: item.id,
            seat: parsed.seat,
            section: getCabinSection(parsed.seat),
            serviceWindow: parsed.serviceWindow,
            amount,
            status: "confirmed",
            createdAt,
            updatedAt: createdAt,
          }],
          agentActions: [createAction(command.flightId, "executed", `Meal reserved for seat ${parsed.seat}`, `${item.name} added to the ${parsed.serviceWindow.toLowerCase()} queue.`), ...current.agentActions],
        },
      };
    }

    case "start_service": {
      const flightUpdate = updateFlight(current, command.flightId, { serviceStatus: "active" });
      return { state: { ...current, ...flightUpdate, agentActions: [createAction(command.flightId, "executed", "Cabin service started", "Crew queue released in cabin-section order."), ...current.agentActions] } };
    }

    case "pause_service": {
      const flightUpdate = updateFlight(current, command.flightId, { serviceStatus: "paused" });
      return { state: { ...current, ...flightUpdate, agentActions: [createAction(command.flightId, "exception", "Crew paused cabin service", "Queue execution stopped immediately. Passenger reservations remain protected."), ...current.agentActions] } };
    }

    case "mark_item_unavailable": {
      const { itemId } = command.payload;
      getFlight(current, command.flightId);
      const item = current.menuItems.find((entry) => entry.id === itemId);
      const affected = current.orders.filter((order) => order.flightId === command.flightId && order.itemId === itemId && !["delivered", "refunded"].includes(order.status)).length;
      return {
        state: {
          ...current,
          inventory: current.inventory.map((row) => row.flightId === command.flightId && row.itemId === itemId ? { ...row, unavailable: true } : row),
          orders: current.orders.map((order) => order.flightId === command.flightId && order.itemId === itemId && !["delivered", "refunded"].includes(order.status) ? { ...order, status: "action_required", updatedAt: new Date().toISOString() } : order),
          agentActions: [createAction(command.flightId, "exception", `${item?.name ?? "Meal"} marked unavailable`, `${affected} affected passenger${affected === 1 ? "" : "s"} asked to approve a substitute or refund. No automatic substitutions made.`), ...current.agentActions],
        },
      };
    }

    case "mark_order_delivered": {
      const flight = getFlight(current, command.flightId);
      if (flight.serviceStatus !== "active") {
        throw new Error("Cabin service must be active before an order can be delivered.");
      }
      const order = getFlightOrder(current, command.flightId, command.payload.orderId);
      if (!["confirmed", "preparing", "substituted"].includes(order.status)) {
        throw new Error("This order is not in a deliverable state.");
      }
      return { state: { ...current, orders: current.orders.map((entry) => entry.id === order.id ? { ...entry, status: "delivered", updatedAt: new Date().toISOString() } : entry), agentActions: [createAction(command.flightId, "executed", `Order ${order.id} delivered`, `Crew confirmed delivery to seat ${order.seat}.`), ...current.agentActions] } };
    }

    case "choose_substitute": {
      const { orderId, itemId } = command.payload;
      const order = getFlightOrder(current, command.flightId, orderId);
      const substitute = current.menuItems.find((entry) => entry.id === itemId);
      if (!substitute || order.status !== "action_required") return { state: current };
      const isApproved = findApprovedSubstitutes(current, order).some((item) => item.id === itemId);
      if (!isApproved) throw new Error("Substitute does not satisfy dietary and inventory policy.");
      return {
        state: {
          ...current,
          inventory: current.inventory.map((row) => row.flightId === command.flightId && row.itemId === order.itemId ? { ...row, reserved: Math.max(0, row.reserved - 1) } : row.flightId === command.flightId && row.itemId === itemId ? { ...row, reserved: row.reserved + 1 } : row),
          orders: current.orders.map((entry) => entry.id === orderId ? { ...entry, originalItemId: entry.itemId, itemId, status: "substituted", updatedAt: new Date().toISOString() } : entry),
          agentActions: [createAction(command.flightId, "approved", `Passenger approved substitute for ${orderId}`, `${substitute.name} reserved for seat ${order.seat}; crew queue updated.`), ...current.agentActions],
        },
      };
    }

    case "refund_order": {
      const order = getFlightOrder(current, command.flightId, command.payload.orderId);
      if (order.status !== "action_required") {
        throw new Error("Refund is only available during passenger resolution.");
      }
      const refund = issueMockRefund(order);
      return {
        result: refund.reference,
        state: {
          ...current,
          inventory: current.inventory.map((row) => row.flightId === command.flightId && row.itemId === order.itemId ? { ...row, reserved: Math.max(0, row.reserved - 1) } : row),
          orders: current.orders.map((entry) => entry.id === order.id ? { ...entry, status: "refunded", updatedAt: refund.completedAt } : entry),
          agentActions: [createAction(command.flightId, "executed", `Mock refund completed for ${order.id}`, `${refund.reference} issued automatically because ${order.amount.toFixed(2)} SGD is below the S$20 policy limit.`), ...current.agentActions],
        },
      };
    }
  }
}
