import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/thank-you")({
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10 md:px-6">
        <div className="w-full rounded-xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold">Thank you for your order!</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your order is confirmed for Cash on Delivery with open-box inspection at doorstep.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/orders">Track My Order</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
