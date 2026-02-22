import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function ElementsPage() {
  return <ComingSoonPanel panel={getPanelOrThrow("elements")} />;
}
