import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function LighthousePage() {
  return <ComingSoonPanel panel={getPanelOrThrow("lighthouse")} />;
}
