import { OrderTracker } from "@/components/order-tracker";

export default async function TrackPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderTracker orderId={orderId} />;
}
