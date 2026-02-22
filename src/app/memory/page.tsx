import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function MemoryPage() {
  return <ComingSoonPanel panel={getPanelOrThrow("memory")} />;
}
