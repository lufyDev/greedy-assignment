import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText, Video } from "lucide-react";
import { KnowledgeInspector } from "@/components/knowledge/knowledge-inspector";
import { getKnowledgeSummary } from "@/lib/knowledge";
import { getModelInfo } from "@/lib/chat/model";

export const metadata: Metadata = {
  title: "Knowledge view | Greedy Adventures prototype",
  description: "Read-only view of the website sources and media the assistant uses.",
};

export default function KnowledgePage() {
  const { sources, media } = getKnowledgeSummary();
  const model = getModelInfo();
  const sectionCount = sources.reduce((n, s) => n + s.sections.length, 0);

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-line bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
            <ArrowLeft className="size-4" aria-hidden /> Back to the experience page
          </Link>
          <h1 className="mt-5 font-display text-5xl font-bold uppercase">Knowledge view</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Read-only. Everything here is served by the same backend modules the chat uses: the captured website text, the media
            catalog, and a live run of the agent for a test question. No API keys or customer conversations are shown or stored.
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-white/50">Model</dt>
              <dd className="font-semibold">{model.mode === "mock" ? "Mock mode (no model key configured)" : model.label}</dd>
            </div>
            <div>
              <dt className="text-white/50">Website sources</dt>
              <dd className="font-semibold">
                {sources.length} page · {sectionCount} sections
              </dd>
            </div>
            <div>
              <dt className="text-white/50">Media files</dt>
              <dd className="font-semibold">
                {media.filter((m) => m.kind === "pdf").length} PDF · {media.filter((m) => m.kind === "video").length} videos
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-5 py-12 sm:px-8">
        <section aria-labelledby="inspect-title">
          <h2 id="inspect-title" className="font-display text-3xl font-bold uppercase">
            Test a question
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Runs the real chat pipeline once (retrieval, media selection and the model) and shows exactly what was passed to the
            model. Each run is a fresh, single-question conversation.
          </p>
          <KnowledgeInspector />
        </section>

        <section aria-labelledby="sources-title">
          <h2 id="sources-title" className="font-display text-3xl font-bold uppercase">
            Website sources
          </h2>
          {sources.map((source) => (
            <article key={source.id} className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line p-5">
                <h3 className="text-lg font-semibold">{source.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink underline-offset-4 hover:underline">
                    {source.url} <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                  <span>Captured {source.capturedAt}</span>
                </p>
              </div>
              <dl className="divide-y divide-line">
                {source.sections.map((section) => (
                  <div key={section.id} className="grid gap-1 p-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                    <dt className="text-sm font-semibold">
                      {section.heading}
                      <span className="mt-0.5 block font-mono text-xs font-normal text-muted">#{section.id}</span>
                    </dt>
                    <dd className="text-sm leading-relaxed text-ink/80">{section.text}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </section>

        <section aria-labelledby="media-title">
          <h2 id="media-title" className="font-display text-3xl font-bold uppercase">
            PDFs and videos
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {media.map((item) => {
              const Icon = item.kind === "pdf" ? FileText : Video;
              return (
                <li key={item.id} className="flex gap-4 rounded-2xl border border-line bg-white p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand text-sunset">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{item.description}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-sand px-2 py-0.5 font-mono">{item.id}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${item.origin === "demo" ? "bg-sunset/15 text-sunset" : "bg-sky/30 text-ink"}`}>
                        {item.origin === "demo" ? "Demo material" : "From website"}
                      </span>
                      {item.package && <span className="rounded-full bg-ink px-2 py-0.5 text-white uppercase">{item.package}</span>}
                    </p>
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-ink underline-offset-4 hover:underline">
                      {item.url}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
