import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/returns")({
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <InfoPageLayout
      title="Returns Policy"
      subtitle="Simple return guidance designed for clarity and fairness."
      sections={[
        {
          heading: "Eligibility",
          content:
            "Return eligibility depends on item condition, category restrictions, and the order verification state captured at delivery.",
        },
        {
          heading: "Return Process",
          content:
            "Initiate a return from your account dashboard, then follow the guided instructions for pickup and seller resolution.",
        },
      ]}
    />
  );
}
