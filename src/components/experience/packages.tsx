import { ArrowUpRight, Camera, Check, Video, VideoOff } from "lucide-react";
import { EXPERIENCE, formatThb } from "@/content/experience";
import { PackagePreview } from "./package-preview";

const MEDIA_ICON = { eco: VideoOff, deluxe: Camera, vip: Video } as const;

export function Packages() {
  return (
    <section id="packages" aria-labelledby="packages-title" className="relative bg-sand py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-sunset uppercase">Choose your package</p>
            <h2 id="packages-title" className="mt-3 font-display text-5xl leading-[0.95] font-bold uppercase sm:text-6xl">
              One jump.
              <br />
              Three ways to remember it.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted">
            Same aircraft, altitude and instructors in every package. You only choose how your jump is filmed.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {EXPERIENCE.packages.map((pkg, i) => {
            const Icon = MEDIA_ICON[pkg.id as keyof typeof MEDIA_ICON];
            const featured = pkg.id === "vip";
            return (
              <li
                key={pkg.id}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  featured
                    ? "border-ink bg-ink text-white shadow-xl shadow-ink/20 hover:shadow-ink/30"
                    : "border-line bg-white hover:shadow-ink/10"
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-ink-2">
                  <PackagePreview pkg={pkg} />
                  <span className="pointer-events-none absolute top-4 left-4 rounded-full bg-black/40 px-3 py-1 font-display text-sm font-semibold tracking-[0.2em] text-white uppercase backdrop-blur">
                    0{i + 1}
                  </span>
                  {featured && (
                    <span className="pointer-events-none absolute top-4 right-4 rounded-full bg-sunset px-3 py-1 text-xs font-semibold text-white">
                      Full media coverage
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="font-display text-4xl font-bold tracking-wide uppercase">{pkg.name}</h3>
                  <p className={`mt-1 text-sm ${featured ? "text-white/70" : "text-muted"}`}>{pkg.tagline}</p>

                  <div className={`mt-6 flex items-start gap-3 rounded-2xl p-4 ${featured ? "bg-white/8" : "bg-sand"}`}>
                    <Icon className={`mt-0.5 size-5 shrink-0 ${featured ? "text-sunset-2" : "text-sunset"}`} aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">{pkg.media}</p>
                      <p className={`mt-0.5 text-sm ${featured ? "text-white/65" : "text-muted"}`}>{pkg.mediaDetail}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                    <p>
                      <span className="font-display text-5xl font-semibold">{formatThb(pkg.priceThb)}</span>
                      <span className={`ml-1.5 text-sm ${featured ? "text-white/60" : "text-muted"}`}>per person</span>
                    </p>
                  </div>
                  <a
                    href={`${EXPERIENCE.sourceUrl}#packages`}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                      featured ? "bg-sunset text-white hover:bg-sunset-2" : "bg-ink text-white hover:bg-ink-3"
                    }`}
                  >
                    Check availability
                    <ArrowUpRight className="size-4" aria-hidden />
                    <span className="sr-only">for {pkg.name} (opens greedyadventures.com in a new tab)</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 rounded-3xl border border-line bg-white/60 p-6 sm:p-8">
          <h3 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">Included in every package</h3>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXPERIENCE.inclusions.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sunset/15 text-sunset">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
