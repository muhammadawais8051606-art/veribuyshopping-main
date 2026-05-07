import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/unbox-protocol")({
  component: UnboxProtocolPage,
});

function UnboxProtocolPage() {
  return (
    <InfoPageLayout
      title="VeriBuy Unbox Protocol"
      subtitle="Our signature trust layer: inspect first, then release payment."
      sections={[
        {
          heading: "Inspection First",
          content:
            "Customers verify package condition and item accuracy at delivery before completing final confirmation in their order dashboard.",
        },
        {
          heading: "Protected Settlement",
          content:
            "Payments remain controlled until verification is complete, reducing delivery disputes and improving confidence for all parties.",
        },
      ]}
      ctaLabel="Open My Orders"
      ctaTo="/orders"
    />
  );
}
