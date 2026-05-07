import { createFileRoute, useSearch } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Search = { issue?: string };

export const Route = createFileRoute("/support")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    issue: typeof s.issue === "string" ? s.issue : undefined,
  }),
  component: SupportPage,
});

function SupportPage() {
  const { issue } = useSearch({ from: "/support" });
  const subject = issue ? `VeriBuy Support - Order ${issue}` : "VeriBuy Support Request";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Support Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Technical issues are sent to sunnykhan8053606@gmail.com.
          </p>
          <Button asChild variant="outline" className="mt-3 min-h-11">
            <a href="https://wa.me/923429839761" target="_blank" rel="noreferrer">Chat with Support Team</a>
          </Button>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name") || "");
              const email = String(fd.get("email") || "");
              const message = String(fd.get("message") || "");
              const to = "sunnykhan8053606@gmail.com";
              const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nIssue Ref: ${issue ?? "N/A"}\n\n${message}`);
              window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
            }}
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" rows={5} required />
            </div>
            <Button type="submit" className="min-h-11 bg-primary hover:bg-primary-hover">Send Support Request</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
