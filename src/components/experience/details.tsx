import Image from "next/image";
import { ArrowUpRight, MapPin, Plane, Sparkles } from "lucide-react";
import { EXPERIENCE } from "@/content/experience";

export function Details() {
  const { location } = EXPERIENCE;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;

  return (
    <section id="details" aria-labelledby="details-title" className="bg-sand py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-sunset uppercase">The details</p>
          <h2 id="details-title" className="mt-3 font-display text-5xl leading-[0.95] font-bold uppercase sm:text-6xl">
            What to expect
          </h2>
          <ul className="mt-10 space-y-5">
            {EXPERIENCE.highlights.map((h) => (
              <li key={h} className="flex gap-4 border-b border-line pb-5 text-lg leading-snug">
                <Sparkles className="mt-1 size-5 shrink-0 text-sunset" aria-hidden />
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
                <MapPin className="size-4 text-sunset" aria-hidden /> Where you jump
              </h3>
              <p className="mt-3 font-semibold">{location.name}</p>
              <p className="mt-1 text-sm text-muted">{location.address}</p>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:underline">
                Open in Maps <ArrowUpRight className="size-3.5" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
                <Plane className="size-4 text-sunset" aria-hidden /> Operated by
              </h3>
              <p className="mt-3 font-semibold">{location.operator}</p>
              <p className="mt-1 text-sm text-muted">USPA-certified tandem instructors. Bangkok pickup available as a fixed-price add-on.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 self-start">
          {EXPERIENCE.gallery.map((img, i) => (
            <div key={img.src} className={`relative overflow-hidden rounded-3xl bg-ink-2 ${i === 0 ? "col-span-2 aspect-[16/10]" : "aspect-square"}`}>
              <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
