import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/guarantee")({
  component: GuaranteePage,
});

function GuaranteePage() {
  return (
    <InfoPageLayout
      title="Buyer Guarantee"
      subtitle="VeriBuy guarantees a transparent process for verified deliveries and fair dispute resolution."
      sections={[
        {
          heading: "Order Protection",
          content:
            "Every eligible order is tracked with payment status and delivery milestones so buyers understand exactly where their order stands.",
        },
        {
          heading: "Resolution Standards",
          content:
            "If there is a mismatch or issue, our dispute and support workflow ensures evidence-based decisions and accountable outcomes.",
        },
      ]}
    />
  );
}
