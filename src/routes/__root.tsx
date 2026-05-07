import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { AddressProvider } from "@/lib/address-context";
import { MobileBottomNav } from "@/components/MobileBottomNav";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VeriBuy — Trust delivered. Multi-vendor marketplace." },
      { name: "description", content: "Shop with confidence on VeriBuy. Pay only after you unbox and verify your delivery. A multi-vendor marketplace for customers, sellers, and admins." },
      { name: "author", content: "VeriBuy" },
      { property: "og:title", content: "VeriBuy — Trust delivered. Multi-vendor marketplace." },
      { property: "og:description", content: "Shop with confidence on VeriBuy. Pay only after you unbox and verify your delivery. A multi-vendor marketplace for customers, sellers, and admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "VeriBuy — Trust delivered. Multi-vendor marketplace." },
      { name: "twitter:description", content: "Shop with confidence on VeriBuy. Pay only after you unbox and verify your delivery. A multi-vendor marketplace for customers, sellers, and admins." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/02186890-751b-45ce-94dc-c1e94f47409a" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/02186890-751b-45ce-94dc-c1e94f47409a" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AddressProvider>
        <CartProvider>
          <Outlet />
          <MobileBottomNav />
          <Toaster richColors position="top-right" />
        </CartProvider>
      </AddressProvider>
    </AuthProvider>
  );
}
