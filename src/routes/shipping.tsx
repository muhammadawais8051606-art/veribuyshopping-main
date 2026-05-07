import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/shipping")({
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <InfoPageLayout
      title="Shipping Information"
      subtitle="Understand delivery timelines, tracking updates, and location coverage."
      sections={[
        {
          heading: "Delivery Windows",
          content:
            "Estimated shipping windows vary by region and seller inventory location. Real-time status is always visible in your order timeline.",
        },
        {
          heading: "Tracking Experience",
          content:
            "Each order includes status checkpoints from placement to handoff, with clear unbox verification steps at final delivery.",
        },
      ]}
    />
  );
}
