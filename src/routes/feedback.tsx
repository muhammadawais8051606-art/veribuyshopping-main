import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Customer Feedback</h1>
          <p className="mt-2 text-sm text-muted-foreground">Post-delivery ratings and reviews are routed to muhammadawais8051606@gmail.com.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name") || "");
              const email = String(fd.get("email") || "");
              const message = String(fd.get("message") || "");
              const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nRating: ${rating}/5\n\n${message}`);
              window.location.href = `mailto:muhammadawais8051606@gmail.com?subject=${encodeURIComponent("VeriBuy Customer Feedback")}&body=${body}`;
            }}
          >
            <div>
              <Label htmlFor="fb_name">Name</Label>
              <Input id="fb_name" name="name" required />
            </div>
            <div>
              <Label htmlFor="fb_email">Email</Label>
              <Input id="fb_email" name="email" type="email" required />
            </div>
            <div>
              <Label>Rating</Label>
              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const value = idx + 1;
                  const active = value <= (hovered || rating);
                  return (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setHovered(value)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(value)}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-md"
                    >
                      <Star className={`h-6 w-6 ${active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
                <span className="ml-2 text-sm text-muted-foreground">{rating ? `${rating}/5` : "Select rating"}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="fb_msg">Feedback</Label>
              <Textarea id="fb_msg" name="message" rows={5} required />
            </div>
            <Button type="submit" className="min-h-11 bg-primary hover:bg-primary-hover">Send Feedback</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
