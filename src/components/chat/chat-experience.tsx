"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChatPanelContext } from "./chat-panel-context";
import { Thread } from "./thread";

/** `?simulate=model-error` on the page URL exercises the model-failure path (see README). */
function simulateFlag(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = new URLSearchParams(window.location.search).get("simulate");
  return value === "model-error" ? value : undefined;
}

export function ChatExperience({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new AssistantChatTransport({ api: "/api/chat", body: () => ({ simulate: simulateFlag() }) }),
    [],
  );
  const runtime = useChatRuntime({ transport });

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    if (!next) requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const controls = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatPanelContext.Provider value={controls}>
        {children}

        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="chat-panel"
          className={`fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-sunset py-3.5 pr-5 pl-4 text-sm font-semibold text-white shadow-2xl shadow-sunset/40 transition hover:bg-sunset-2 sm:right-6 sm:bottom-6 ${open ? "pointer-events-none scale-90 opacity-0" : ""}`}
        >
          <MessageCircle className="size-5" aria-hidden />
          Ask our guide
        </button>

        <div
          id="chat-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-panel-title"
          hidden={!open}
          className="fixed inset-0 z-50 flex animate-pop flex-col overflow-hidden bg-sand shadow-2xl shadow-ink/30 sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(44rem,calc(100dvh-3rem))] sm:w-[26rem] sm:rounded-3xl sm:border sm:border-line"
        >
          <header className="flex items-center justify-between gap-3 bg-ink px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="relative grid size-9 place-items-center rounded-full bg-sunset font-display text-lg font-bold">
                G
                <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-ink bg-emerald-400" aria-hidden />
              </span>
              <div>
                <h2 id="chat-panel-title" className="text-sm font-semibold whitespace-nowrap">
                  Greedy Adventures guide
                </h2>
                <p className="text-xs whitespace-nowrap text-white/60">Sea View Skydiving · Pattaya</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/knowledge"
                className="hidden rounded-lg px-2 py-1.5 text-xs whitespace-nowrap text-white/70 transition hover:bg-white/10 hover:text-white sm:block"
              >
                Knowledge view
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-lg transition hover:bg-white/10"
                aria-label="Close chat"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1">
            <Thread />
          </div>
        </div>
      </ChatPanelContext.Provider>
    </AssistantRuntimeProvider>
  );
}
