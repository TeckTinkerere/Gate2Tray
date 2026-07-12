import { CrewBoard } from "@/components/crew-board";

export default async function CrewPage({ params }: { params: Promise<{ flightId: string }> }) {
  const { flightId } = await params;
  return <CrewBoard flightId={flightId} />;
}
