import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/careers")({
  component: CareersPage,
});

function CareersPage() {
  return (
    <InfoPageLayout
      title="Careers at VeriBuy"
      subtitle="Join a high-ownership team designing the future of secure marketplace commerce."
      sections={[
        {
          heading: "What We Value",
          content:
            "We hire builders who care about customer trust, clean execution, and shipping high-quality products that scale responsibly.",
        },
        {
          heading: "Open Roles",
          content:
            "Current openings include product engineering, operations, seller success, and risk management. Share your profile to start the conversation.",
        },
      ]}
    />
  );
}
