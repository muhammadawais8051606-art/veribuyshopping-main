import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

type InfoPageLayoutProps = {
  title: string;
  subtitle: string;
  sections: Array<{ heading: string; content: string }>;
  ctaLabel?: string;
  ctaTo?: string;
};

export function InfoPageLayout({ title, subtitle, sections, ctaLabel, ctaTo }: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6">
        <section className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">{subtitle}</p>
          {ctaLabel && ctaTo && (
            <Button asChild className="mt-5 bg-primary hover:bg-primary-hover">
              <Link to={ctaTo as never}>{ctaLabel}</Link>
            </Button>
          )}
        </section>
        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border bg-card p-5 md:p-6">
              <h2 className="text-lg font-semibold md:text-xl">{section.heading}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">{section.content}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
