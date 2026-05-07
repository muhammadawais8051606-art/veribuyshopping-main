import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/affiliate")({
  component: AffiliatePage,
});

function AffiliatePage() {
  return (
    <InfoPageLayout
      title="Affiliate Program"
      subtitle="Promote trusted commerce and earn commissions through verified customer referrals."
      sections={[
        {
          heading: "How It Works",
          content:
            "Affiliates receive trackable referral links and performance analytics dashboards to monitor clicks, conversions, and approved earnings.",
        },
        {
          heading: "Payout Model",
          content:
            "Affiliate payouts are calculated from validated orders and settled through transparent monthly statements.",
        },
      ]}
    />
  );
}
