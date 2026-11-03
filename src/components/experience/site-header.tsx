import Link from "next/link";
import { OpenChatButton } from "@/components/chat/open-chat-button";
import { MobileNav } from "./mobile-nav";

const NAV = [
  { href: "#packages", label: "Packages" },
  { href: "#plan", label: "The plan" },
  { href: "#details", label: "Details" },
  { href: "#faq", label: "Good to know" },
];

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-8">
        <Link href="/" className="font-display text-xl leading-none font-bold tracking-[0.08em] text-white uppercase">
          Greedy
          <span className="block text-[0.55rem] font-semibold tracking-[0.42em] text-white/70">Adventures</span>
        </Link>
        <nav aria-label="Page sections" className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm font-medium text-white/80">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/knowledge"
            className="rounded-full px-3 py-2 text-xs font-medium text-white/70 transition hover:text-white"
          >
            Knowledge view
          </Link>
          <OpenChatButton className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg shadow-black/10 transition hover:bg-sand sm:inline-block">
            Ask our guide
          </OpenChatButton>
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
