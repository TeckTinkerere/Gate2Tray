import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

const labels: Record<OrderStatus, string> = {
  confirmed: "Reserved",
  preparing: "Preparing",
  delivered: "Delivered",
  action_required: "Needs passenger choice",
  substituted: "Substitute approved",
  refunded: "Refunded",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === "action_required" ? "danger" : status === "delivered" || status === "substituted" ? "success" : status === "refunded" ? "neutral" : "primary";
  return <Badge tone={tone}>{labels[status]}</Badge>;
}
