import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function PerformancePage() {
  return <ComingSoonPanel panel={getPanelOrThrow("performance")} />;
}
