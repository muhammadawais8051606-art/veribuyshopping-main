import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <InfoPageLayout
      title="About VeriBuy"
      subtitle="VeriBuy is built around trust-first commerce where buyers verify deliveries before funds are released."
      sections={[
        {
          heading: "Our Mission",
          content:
            "We are creating the most trusted shopping experience in Pakistan by combining modern marketplace convenience with buyer-first payment protection.",
        },
        {
          heading: "How VeriBuy Works",
          content:
            "Customers place an order, receive the package, and complete VeriBuy Unbox verification. Once confirmed, funds are released to the seller.",
        },
      ]}
      ctaLabel="Shop Now"
      ctaTo="/shop"
    />
  );
}
