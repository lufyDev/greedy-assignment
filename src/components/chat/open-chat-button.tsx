"use client";

import type { ReactNode } from "react";
import { useChatPanel } from "./chat-panel-context";

export function OpenChatButton({ className, children }: { className?: string; children: ReactNode }) {
  const { open, setOpen } = useChatPanel();
  return (
    <button type="button" className={className} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="chat-panel">
      {children}
    </button>
  );
}
