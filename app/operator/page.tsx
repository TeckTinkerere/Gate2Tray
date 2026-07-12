import { OperatorDashboard } from "@/components/operator-dashboard";
import { OperatorShell } from "@/components/operator-shell";

export default function OperatorPage() {
  return <OperatorShell><OperatorDashboard /></OperatorShell>;
}
