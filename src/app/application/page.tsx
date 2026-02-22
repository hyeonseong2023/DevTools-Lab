import { ComingSoonPanel } from "@/components/guide/ComingSoonPanel";
import { getPanelOrThrow } from "@/lib/panels";

export default function ApplicationPage() {
  return <ComingSoonPanel panel={getPanelOrThrow("application")} />;
}
