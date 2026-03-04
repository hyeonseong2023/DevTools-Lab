import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function RecorderPage() {
  return <ComingSoonPanel panel={getPanelOrThrow("recorder")} />;
}
