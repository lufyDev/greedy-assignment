import Image from "next/image";
import { EXPERIENCE } from "@/content/experience";

export function Plan() {
  return (
    <section id="plan" aria-labelledby="plan-title" className="grain relative overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-xs font-semibold tracking-[0.3em] text-sky uppercase">The plan</p>
        <h2 id="plan-title" className="mt-3 max-w-3xl font-display text-5xl leading-[0.95] font-bold uppercase sm:text-6xl">
          From check-in to touchdown in about three hours
        </h2>

        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {EXPERIENCE.plan.map((step, i) => (
            <li key={step.title} className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={step.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" aria-hidden />
                <span className="absolute bottom-3 left-4 font-display text-6xl leading-none font-bold text-white/90" aria-hidden>
                  {i + 1}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
