import { ChevronDown, MessageCircle } from "lucide-react";
import { OpenChatButton } from "@/components/chat/open-chat-button";
import { EXPERIENCE } from "@/content/experience";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-line bg-sand-2/60 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-sunset uppercase">Good to know</p>
          <h2 id="faq-title" className="mt-3 font-display text-5xl leading-[0.95] font-bold uppercase sm:text-6xl">
            Questions before you jump?
          </h2>
          <p className="mt-5 max-w-sm text-muted">
            Our assistant answers from this page and can send you the brochure or a video of the jump.
          </p>
          <OpenChatButton className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-3">
            <MessageCircle className="size-4" aria-hidden />
            Ask our guide
          </OpenChatButton>
        </div>

        <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
          {EXPERIENCE.faq.map((item, i) => (
            <details key={item.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left text-lg font-semibold transition hover:bg-sand/60 [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-5 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="px-6 pb-6 leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
