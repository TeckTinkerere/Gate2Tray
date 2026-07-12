import { PassengerOrder } from "@/components/passenger-order";

export default async function OrderPage({ params }: { params: Promise<{ flightId: string }> }) {
  const { flightId } = await params;
  return <PassengerOrder flightId={flightId} />;
}
