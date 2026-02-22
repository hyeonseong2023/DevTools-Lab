import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function NetworkPage() {
  return <ComingSoonPanel panel={getPanelOrThrow("network")} />;
}
