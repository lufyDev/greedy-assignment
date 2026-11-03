"use client";

import { AlertTriangle, FileText, Loader2, Play, Video } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SafeMarkdown } from "@/components/safe-markdown";
import type { TurnTrace } from "@/lib/chat/agent";

const EXAMPLES = [
  "What is included in the package?",
  "How much is the VIP package?",
  "Send me the brochure and a video.",
  "Can I see an ECO video?",
  "Is there a weight limit?",
];

type State = { status: "idle" } | { status: "loading"; question: string } | { status: "done"; trace: TurnTrace } | { status: "error"; message: string };

export function KnowledgeInspector() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function run(q: string) {
    const text = q.trim();
    if (!text) return;
    setQuestion(text);
    setState({ status: "loading", question: text });
    try {
      const res = await fetch("/api/knowledge/inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setState({ status: "done", trace: data as TurnTrace });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Request failed" });
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void run(question);
  };

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row">
        <label htmlFor="inspect-question" className="sr-only">
          Test question
        </label>
        <input
          id="inspect-question"
          name="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={1000}
          placeholder="Ask a test question…"
          className="min-w-0 flex-1 rounded-xl border border-line bg-sand/50 px-4 py-3 text-base outline-none focus:border-ink sm:text-sm"
        />
        <button
          type="submit"
          disabled={state.status === "loading" || !question.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-3 disabled:opacity-50"
        >
          {state.status === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
          Run agent
        </button>
      </form>
      <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => void run(ex)}
            disabled={state.status === "loading"}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium transition hover:border-sunset hover:bg-sunset/5 disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="p-5">
        {state.status === "idle" && <p className="text-sm text-muted">Pick an example or type a question to see what the agent does with it.</p>}
        {state.status === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Running the agent for “{state.question}”…
          </p>
        )}
        {state.status === "error" && (
          <p role="alert" className="flex items-center gap-2 text-sm text-red-800">
            <AlertTriangle className="size-4" aria-hidden /> {state.message}
          </p>
        )}
        {state.status === "done" && <TraceView trace={state.trace} />}
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-3">
      <span className="grid size-7 place-items-center rounded-full bg-ink font-display text-sm font-bold text-white">{n}</span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="mt-2 text-sm">{children}</div>
      </div>
    </li>
  );
}

function TraceView({ trace }: { trace: TurnTrace }) {
  const req = trace.mediaRequest;
  const requested = [req.pdf && "PDF", req.video && "video"].filter(Boolean).join(" + ");

  return (
    <ol className="space-y-6">
      <Step n={1} title="Retrieval">
        {!trace.retrievalQuery ? (
          <p className="text-muted">Skipped. This is only a file request, so no website text is needed.</p>
        ) : (
          <p className="wrap-anywhere text-muted">
            Query: <code className="rounded bg-sand px-1.5 py-0.5 text-ink">{trace.retrievalQuery}</code>
          </p>
        )}
        {!trace.retrievalQuery ? null : trace.usedFixedReply ? (
          <p className="mt-2 text-muted">This is a safety or policy topic the page doesn&apos;t cover, so the model is not called and can&apos;t guess. The fixed reply below is sent.</p>
        ) : trace.chunks.length === 0 ? (
          <p className="mt-2 text-muted">No section matched, so the model only gets a general summary of the page.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {trace.chunks.map((c) => (
              <li key={c.chunkId} className="rounded-full border border-line px-2.5 py-1 text-xs">
                {c.heading} <span className="font-mono text-muted">score {c.score}</span>
              </li>
            ))}
          </ul>
        )}
      </Step>

      <Step n={2} title="Exact source text passed to the model">
        {trace.usedFixedReply ? (
          <p className="text-muted">Nothing was passed. The model was not called for this question.</p>
        ) : (
          <>
            <pre className="max-h-72 overflow-auto rounded-xl bg-ink p-4 text-xs leading-relaxed whitespace-pre-wrap text-white/90">{trace.contextPassedToModel}</pre>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-muted">Full instructions sent with it</summary>
              <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-sand p-4 text-xs leading-relaxed whitespace-pre-wrap">{trace.instructions}</pre>
            </details>
          </>
        )}
      </Step>

      <Step n={3} title="Media decision">
        <p className="text-muted">
          {requested ? `Customer asked for: ${requested}` : "No file requested."}
          {trace.mediaSelectedBy && ` · selected by ${trace.mediaSelectedBy === "rules" ? "rules (deterministic)" : "the model's own tool call"}`}
        </p>
        {trace.media && (
          <ul className="mt-2 space-y-1.5">
            {trace.media.items.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-2">
                {m.kind === "pdf" ? <FileText className="size-4 text-sunset" aria-hidden /> : <Video className="size-4 text-sunset" aria-hidden />}
                <span className="font-medium">{m.title}</span>
                <span className="font-mono text-xs text-muted">{m.id}</span>
              </li>
            ))}
            {trace.media.unavailable.map((u, i) => (
              <li key={i} className="flex items-start gap-2 text-muted">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sunset" aria-hidden />
                {u.kind.toUpperCase()} unavailable: {u.reason}
              </li>
            ))}
          </ul>
        )}
      </Step>

      <Step n={4} title={`Answer · ${trace.usedFixedReply ? "fixed reply, no model call" : trace.mode === "mock" ? "Mock mode" : trace.model} · ${trace.durationMs} ms`}>
        {trace.error ? (
          <p role="alert" className="text-red-800">
            {trace.error}
          </p>
        ) : (
          <div className="rounded-xl border border-line bg-sand/50 p-4">
            <SafeMarkdown>{trace.answer ?? ""}</SafeMarkdown>
          </div>
        )}
      </Step>
    </ol>
  );
}
