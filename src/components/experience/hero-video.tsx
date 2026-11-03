"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Background film with a pause control; starts paused for reduced-motion users. */
export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const pausedByVisitor = useRef(false);
  const [playing, setPlaying] = useState(false);

  // Also runs when the page is shown again after navigating back (see usePauseWhenHidden).
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!pausedByVisitor.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
    return () => video.pause();
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    pausedByVisitor.current = !video.paused;
    if (video.paused) void video.play().then(() => setPlaying(true));
    else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute top-20 right-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/50 sm:right-8"
        aria-label={playing ? "Pause background video" : "Play background video"}
      >
        {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
        {playing ? "Pause" : "Play"}
      </button>
    </>
  );
}
