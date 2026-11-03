import { ArrowDown, MapPin, MessageCircle } from "lucide-react";
import { OpenChatButton } from "@/components/chat/open-chat-button";
import { EXPERIENCE, formatThb } from "@/content/experience";
import { HeroVideo } from "./hero-video";

export function Hero() {
  const fromPrice = Math.min(...EXPERIENCE.packages.map((p) => p.priceThb));

  return (
    <section aria-labelledby="hero-title" className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white">
      <HeroVideo src={EXPERIENCE.heroVideo} poster={EXPERIENCE.heroPoster} />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/20 to-ink/90" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pt-32 pb-20 sm:px-8">
        <p className="flex animate-rise items-center gap-2 text-xs font-semibold tracking-[0.3em] text-sky uppercase">
          <MapPin className="size-3.5" aria-hidden />
          {EXPERIENCE.eyebrow} · Thailand
        </p>
        <h1
          id="hero-title"
          className="mt-4 max-w-4xl animate-rise font-display text-[clamp(3.4rem,11vw,9.5rem)] leading-[0.86] font-bold tracking-tight uppercase [animation-delay:80ms]"
        >
          Sea View
          <span className="block bg-gradient-to-r from-white via-white to-sunset-2 bg-clip-text text-transparent">Skydiving</span>
        </h1>
        <p className="mt-5 max-w-xl animate-rise text-base leading-relaxed text-white/80 [animation-delay:160ms] sm:text-lg">
          {EXPERIENCE.summary}
        </p>

        <div className="mt-8 flex animate-rise flex-wrap items-center gap-3 [animation-delay:240ms]">
          <a
            href="#packages"
            className="group inline-flex items-center gap-2 rounded-full bg-sunset px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-sunset/30 transition hover:bg-sunset-2"
          >
            Choose your package
            <ArrowDown className="size-4 transition group-hover:translate-y-0.5" aria-hidden />
          </a>
          <OpenChatButton className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20">
            <MessageCircle className="size-4" aria-hidden />
            Ask a question
          </OpenChatButton>
          <p className="text-sm text-white/70 sm:ml-3">
            From <span className="font-display text-2xl font-semibold text-white">{formatThb(fromPrice)}</span> per person
          </p>
        </div>

        <dl className="mt-12 grid animate-rise grid-cols-2 overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md [animation-delay:320ms] sm:grid-cols-4">
          {EXPERIENCE.stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col-reverse gap-1 px-5 py-4 sm:px-6 sm:py-5 ${i > 0 ? "sm:border-l" : ""} ${i % 2 === 1 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} border-white/15`}
            >
              <dt className="text-xs tracking-wider text-white/60 uppercase">{s.label}</dt>
              <dd className="font-display text-3xl font-semibold sm:text-4xl">
                {s.value}
                <span className="ml-1 text-base font-medium text-white/70">{s.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
