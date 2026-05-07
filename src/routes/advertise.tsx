import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/advertise")({
  component: AdvertisePage,
});

function AdvertisePage() {
  return (
    <InfoPageLayout
      title="Advertise on VeriBuy"
      subtitle="Reach high-intent shoppers with premium placements built for trust and conversion."
      sections={[
        {
          heading: "Sponsored Placement",
          content:
            "Brands can run homepage, category, and product discovery campaigns optimized for mobile-first shopping behavior.",
        },
        {
          heading: "Measurement & Insights",
          content:
            "Campaign dashboards provide clear performance metrics, including impressions, product clicks, and conversion lift.",
        },
      ]}
    />
  );
}
