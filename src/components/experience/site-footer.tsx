import Link from "next/link";
import { EXPERIENCE } from "@/content/experience";

export function SiteFooter() {
  return (
    <footer className="bg-ink pt-12 pb-24 text-sm text-white/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="font-display text-lg font-bold tracking-[0.08em] text-white uppercase">Greedy Adventures · prototype</p>
          <p>
            Built for the Full-Stack Developer assignment. Page text, photos and videos are from the public{" "}
            <a href={EXPERIENCE.sourceUrl} className="text-white underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
              Sea View Skydiving page
            </a>
            . The brochure PDF is demo material. No bookings or payments are taken here.
          </p>
          <p>Chat built with assistant-ui and the Vercel AI SDK. Icons by Lucide.</p>
        </div>
        <nav aria-label="Prototype links">
          <ul className="space-y-2">
            <li>
              <Link href="/knowledge" className="text-white underline-offset-4 hover:underline">
                Knowledge view
              </Link>
            </li>
            <li>
              <a href="#packages" className="text-white underline-offset-4 hover:underline">
                Packages
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
