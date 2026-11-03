"use client";

import { AlertTriangle, Download, ExternalLink, FileText, Play } from "lucide-react";
import { useRef, useState } from "react";
import { usePauseWhenHidden } from "@/components/use-pause-when-hidden";
import type { MediaItem } from "@/lib/media/catalog";
import type { MediaSelection } from "@/lib/media/types";

function OriginBadge({ origin }: { origin: MediaItem["origin"] }) {
  return origin === "demo" ? (
    <span className="rounded-full bg-sunset/15 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-sunset uppercase">Demo material</span>
  ) : (
    <span className="rounded-full bg-sky/30 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-ink uppercase">From our website</span>
  );
}

export function PdfCard({ item }: { item: MediaItem }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-start gap-3 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sunset/10 text-sunset">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted">{item.fileSizeLabel}</p>
          <div className="mt-1.5">
            <OriginBadge origin={item.origin} />
          </div>
        </div>
      </div>
      <object data={`${item.url}#view=FitH&toolbar=0`} type="application/pdf" className="hidden h-56 w-full border-y border-line bg-sand sm:block" aria-label={`${item.title} preview`}>
        <p className="p-4 text-xs text-muted">PDF preview isn&apos;t supported in this browser. Use Open or Download below.</p>
      </object>
      <div className="flex gap-2 p-3">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-ink-3"
        >
          <ExternalLink className="size-3.5" aria-hidden /> Open
          <span className="sr-only">{item.title} (new tab)</span>
        </a>
        <a
          href={item.url}
          download
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-xs font-semibold transition hover:bg-sand"
        >
          <Download className="size-3.5" aria-hidden /> Download
          <span className="sr-only">{item.title}</span>
        </a>
      </div>
    </div>
  );
}

export function VideoCard({ item }: { item: MediaItem }) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  usePauseWhenHidden(videoRef);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {failed ? (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-sand p-4 text-center text-xs text-muted">
          <AlertTriangle className="size-5 text-sunset" aria-hidden />
          The video couldn&apos;t load here.
        </div>
      ) : (
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black"
          src={item.url}
          poster={item.posterUrl}
          controls
          playsInline
          preload="none"
          onError={() => setFailed(true)}
          aria-label={item.title}
        />
      )}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Play className="size-3.5 fill-current text-sunset" aria-hidden />
            {item.title}
          </p>
          <p className="mt-0.5 text-xs text-muted">{item.description}</p>
          <div className="mt-1.5">
            <OriginBadge origin={item.origin} />
          </div>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ink underline-offset-4 hover:underline"
        >
          Watch <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">{item.title} in a new tab</span>
        </a>
      </div>
    </div>
  );
}

export function MediaSelectionView({ selection }: { selection: MediaSelection }) {
  return (
    <div className="space-y-3">
      {selection.items.map((item) => (item.kind === "pdf" ? <PdfCard key={item.id} item={item} /> : <VideoCard key={item.id} item={item} />))}
      {selection.unavailable.map((u, i) => (
        <p key={`${u.kind}-${i}`} role="status" className="flex items-start gap-2 rounded-xl border border-dashed border-line bg-sand/70 px-3 py-2.5 text-xs text-muted">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-sunset" aria-hidden />
          <span>
            <span className="font-semibold text-ink">{u.kind === "pdf" ? "PDF" : "Video"} unavailable.</span> {u.reason}
          </span>
        </p>
      ))}
    </div>
  );
}
