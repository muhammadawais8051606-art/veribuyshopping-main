import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/disputes")({
  component: DisputesPage,
});

function DisputesPage() {
  return (
    <InfoPageLayout
      title="Disputes & Resolution"
      subtitle="A clear and auditable path for handling delivery or product issues."
      sections={[
        {
          heading: "How to Raise a Dispute",
          content:
            "From your Orders page, select the order and file a dispute with supporting details so our team can review quickly.",
        },
        {
          heading: "Review Timeline",
          content:
            "Disputes are prioritized by evidence completeness, seller response time, and logistics confirmation signals.",
        },
      ]}
    />
  );
}
