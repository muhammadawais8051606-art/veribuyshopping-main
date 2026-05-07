import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/seller-onboarding")({
  component: SellerOnboardingPage,
});

function SellerOnboardingPage() {
  return (
    <InfoPageLayout
      title="Seller Onboarding"
      subtitle="Launch your store with a professional multi-step verification and payout setup flow."
      sections={[
        {
          heading: "Step 1: Business Information",
          content:
            "Provide your public store name, legal entity details, warehouse location, and contact profile used for customer communication.",
        },
        {
          heading: "Step 2: Verification",
          content:
            "Upload national ID or trade documents so our trust team can validate identity and protect marketplace buyers from fraud.",
        },
        {
          heading: "Step 3: Bank Details",
          content:
            "Configure payout banking with verified ownership details so approved earnings are transferred through the admin payout pipeline.",
        },
      ]}
      ctaLabel="Start Seller Application"
      ctaTo="/become-seller"
    />
  );
}
