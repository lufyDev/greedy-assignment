"use client";

import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import { ArrowDown, ArrowUp, ExternalLink, FlaskConical, RotateCcw, Square } from "lucide-react";
import type { ReplyMetadata } from "@/lib/chat/agent";
import { MarkdownText } from "./markdown-text";
import { ShareMediaToolUI } from "./share-media-tool";

const SUGGESTIONS = [
  "What is included in the package?",
  "Can you send me a brochure?",
  "Can I see a video of the experience?",
  "Send me the brochure and a video.",
];

export function Thread() {
  return (
    <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col">
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-5" aria-live="polite">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <Welcome />
        </AuiIf>
        <ThreadPrimitive.Messages>{({ message }) => (message.role === "user" ? <UserMessage /> : <AssistantMessage />)}</ThreadPrimitive.Messages>
        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto flex justify-center pt-2">
          <ThreadPrimitive.ScrollToBottom
            className="grid size-8 place-items-center rounded-full border border-line bg-white shadow-md transition hover:bg-sand disabled:invisible"
            aria-label="Scroll to latest message"
          >
            <ArrowDown className="size-4" aria-hidden />
          </ThreadPrimitive.ScrollToBottom>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
      <Composer />
    </ThreadPrimitive.Root>
  );
}

function Welcome() {
  return (
    <div className="animate-pop">
      <p className="font-display text-3xl leading-none font-bold uppercase">Hi, ready to jump?</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        I answer from the Sea View Skydiving page and can send you the brochure or a video. Ask me anything, or try one of these:
      </p>
      <ul className="mt-4 grid gap-2">
        {SUGGESTIONS.map((prompt) => (
          <li key={prompt}>
            <ThreadPrimitive.Suggestion
              prompt={prompt}
              send
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-left text-sm font-medium transition hover:border-sunset hover:bg-sunset/5"
            >
              {prompt}
            </ThreadPrimitive.Suggestion>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex animate-pop justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-white">
        <span className="sr-only">You said: </span>
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex animate-pop flex-col gap-2">
      <span className="sr-only">Assistant:</span>
      <div className="flex max-w-[95%] flex-col gap-3">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            tools: { by_name: { share_media: ShareMediaToolUI } },
          }}
        />
      </div>
      <MessagePrimitive.Error>
        <ErrorPrimitive.Root role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-900">
          <ErrorPrimitive.Message className="flex-1" />
          <ActionBarPrimitive.Reload className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-red-900 shadow-sm transition hover:bg-red-100">
            <RotateCcw className="size-3.5" aria-hidden /> Try again
          </ActionBarPrimitive.Reload>
        </ErrorPrimitive.Root>
      </MessagePrimitive.Error>
      <ReplyFooter />
    </MessagePrimitive.Root>
  );
}

const NO_SOURCES: ReplyMetadata["sources"] = [];

/** Source links for the sections the answer was grounded on, plus a mock-mode label. */
function ReplyFooter() {
  const isDone = useAuiState((s) => s.message.status?.type === "complete");
  const sources = useAuiState((s) => (s.message.metadata.custom as Partial<ReplyMetadata>).sources ?? NO_SOURCES);
  const mode = useAuiState((s) => (s.message.metadata.custom as Partial<ReplyMetadata>).mode);
  if (!isDone) return null;
  if (sources.length === 0 && mode !== "mock") return null;

  const [first] = sources;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      {first && (
        <a
          href={first.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-line bg-white px-2.5 py-1 font-medium text-ink transition hover:border-sunset"
          title={sources.map((s) => s.heading).join(" · ")}
        >
          <ExternalLink className="mr-1.5 inline size-3 align-[-1px]" aria-hidden />
          Source: Sea View Skydiving page <span className="text-muted">· {first.heading.replace(/^FAQ: /, "")}</span>
          <span className="sr-only"> (opens greedyadventures.com)</span>
        </a>
      )}
      {mode === "mock" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sunset/15 px-2 py-0.5 font-semibold text-sunset" title="No model key configured: deterministic answer from the source text">
          <FlaskConical className="size-3" aria-hidden /> Mock mode
        </span>
      )}
    </div>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="border-t border-line bg-white p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-sand/50 p-1.5 focus-within:border-ink">
        <ComposerPrimitive.Input
          name="message"
          rows={1}
          maxLength={1000}
          submitMode="enter"
          placeholder="Ask about the jump or packages…"
          aria-label="Message the Greedy Adventures assistant"
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-base outline-none placeholder:text-muted focus-visible:outline-none sm:text-sm"
        />
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunset text-white transition hover:bg-sunset-2 disabled:bg-line disabled:text-muted"
            aria-label="Send message"
          >
            <ArrowUp className="size-4" aria-hidden />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:bg-ink-3" aria-label="Stop generating">
            <Square className="size-3.5 fill-current" aria-hidden />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
      <p className="mt-2 px-1 text-[0.7rem] text-muted">Answers come from the public page. No bookings or payments here.</p>
    </ComposerPrimitive.Root>
  );
}
