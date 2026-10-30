"use client";

import { createContext, useContext } from "react";

export type ChatPanelControls = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const ChatPanelContext = createContext<ChatPanelControls | null>(null);

export function useChatPanel(): ChatPanelControls {
  const ctx = useContext(ChatPanelContext);
  if (!ctx) throw new Error("useChatPanel must be used inside <ChatExperience>");
  return ctx;
}
