"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import type { ExperiencePackage } from "@/content/experience";

/** Package media: a still for ECO, a click-to-play preview for Deluxe and VIP. */
export function PackagePreview({ pkg }: { pkg: ExperiencePackage }) {
  const [playing, setPlaying] = useState(false);
  const { preview } = pkg;

  if (preview.type === "image") {
    return (
      <Image
        src={preview.src}
        alt={`${pkg.name} package: tandem jump over Pattaya`}
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover"
      />
    );
  }

  if (playing) {
    return (
      <video
        className="absolute inset-0 h-full w-full bg-black object-cover"
        src={preview.src}
        poster={preview.poster}
        controls
        autoPlay
        playsInline
        aria-label={`${pkg.name} package preview video`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group/play absolute inset-0 h-full w-full cursor-pointer"
      aria-label={`Play ${pkg.name} package preview video`}
    >
      <Image src={preview.poster} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" aria-hidden />
      <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-lg transition group-hover/play:bg-white">
        <Play className="size-3.5 fill-current" aria-hidden />
        Watch preview
      </span>
    </button>
  );
}
