import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 hidden bg-nav text-nav-foreground md:block">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <h4 className="mb-3 font-semibold">Get to Know Us</h4>
          <ul className="space-y-1 text-sm opacity-80">
            <li><Link to="/about" className="hover:underline">About VeriBuy</Link></li>
            <li><Link to="/careers" className="hover:underline">Careers</Link></li>
            <li><Link to="/press" className="hover:underline">Press</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Make Money with Us</h4>
          <ul className="space-y-1 text-sm opacity-80">
            <li><Link to="/seller-onboarding" className="hover:underline">Sell on VeriBuy</Link></li>
            <li><Link to="/affiliate" className="hover:underline">Affiliate Program</Link></li>
            <li><Link to="/advertise" className="hover:underline">Advertise</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">VeriBuy Protection</h4>
          <ul className="space-y-1 text-sm opacity-80">
            <li><Link to="/unbox-protocol" className="hover:underline">Unbox Verification</Link></li>
            <li><Link to="/guarantee" className="hover:underline">Buyer Guarantee</Link></li>
            <li><Link to="/disputes" className="hover:underline">Disputes</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Help</h4>
          <ul className="space-y-1 text-sm opacity-80">
            <li><Link to="/profile" className="hover:underline">Your Account</Link></li>
            <li><Link to="/shipping" className="hover:underline">Shipping</Link></li>
            <li><Link to="/returns" className="hover:underline">Returns</Link></li>
          </ul>
          <div className="mt-4 space-y-2 text-xs">
            <a
              href="mailto:sunnykhan8053606@gmail.com?subject=VeriBuy%20Technical%20Issue"
              className="flex items-center gap-2 opacity-90 hover:opacity-100"
            >
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <Mail className="h-3.5 w-3.5" />
              Tech Support (Team Online)
            </a>
            <a
              href="mailto:muhammadawais8051606@gmail.com?subject=VeriBuy%20General%20Feedback"
              className="flex items-center gap-2 opacity-90 hover:opacity-100"
            >
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <Mail className="h-3.5 w-3.5" />
              Feedback (Team Online)
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-nav-accent py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} VeriBuy — Trust delivered.
      </div>
    </footer>
  );
}
