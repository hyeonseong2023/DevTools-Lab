import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function ConsolePage() {
  return <ComingSoonPanel panel={getPanelOrThrow("console")} />;
}
