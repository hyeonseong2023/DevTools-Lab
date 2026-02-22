import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function SecurityPage() {
  return <ComingSoonPanel panel={getPanelOrThrow("security")} />;
}
