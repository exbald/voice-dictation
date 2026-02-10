import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { ProviderToggle } from "./ui/provider-toggle";

export function SiteHeader() {
  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md"
      >
        Skip to main content
      </a>
      <header
        className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md"
        role="banner"
      >
        <nav
          className="container mx-auto px-4 py-4 flex justify-between items-center"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-semibold text-foreground hover:text-foreground/80 transition-colors font-serif tracking-tight"
            aria-label="Vox - Go to homepage"
          >
            Vox
            <span className="hidden text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70 sm:inline">
              Studio
            </span>
          </Link>
          <div
            className="flex items-center gap-3"
            role="group"
            aria-label="User actions"
          >
            <ProviderToggle />
            <UserProfile />
            <ModeToggle />
          </div>
        </nav>
      </header>
    </>
  );
}
