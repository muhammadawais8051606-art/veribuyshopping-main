import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/press")({
  component: PressPage,
});

function PressPage() {
  return (
    <InfoPageLayout
      title="Press & Media"
      subtitle="Find media resources, platform milestones, and official updates from VeriBuy."
      sections={[
        {
          heading: "Media Inquiries",
          content:
            "For interviews, product briefings, or partnership announcements, contact our communications team for coordinated support.",
        },
        {
          heading: "Brand Assets",
          content:
            "Press kits, logos, and approved messaging are available on request to ensure consistent and accurate representation.",
        },
      ]}
    />
  );
}
