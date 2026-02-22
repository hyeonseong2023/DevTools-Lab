import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function SourcesPage() {
  return <ComingSoonPanel panel={getPanelOrThrow("sources")} />;
}
