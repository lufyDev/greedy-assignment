import { z } from "zod";
import type { ChatLine } from "./plan";

export const MAX_MESSAGES = 40;
export const MAX_TEXT_CHARS = 1000;

const partSchema = z.looseObject({ type: z.string().max(64) });

const messageSchema = z.looseObject({
  id: z.string().max(128),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(partSchema).max(50),
});

export const chatRequestSchema = z.looseObject({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  /** Test hook used by the verification steps to exercise the model-failure path. */
  simulate: z.enum(["model-error"]).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type ValidationResult = { ok: true; data: ChatRequest; lines: ChatLine[] } | { ok: false; error: string };

/** Validates the body and extracts plain-text conversation lines for planning. */
export function parseChatRequest(body: unknown): ValidationResult {
  const rawMessages = (body as { messages?: unknown } | null)?.messages;
  if (Array.isArray(rawMessages) && rawMessages.length > MAX_MESSAGES) {
    return { ok: false, error: "This chat has reached its length limit. Please reload the page to start a new one." };
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: "Invalid chat request." };

  const { messages } = parsed.data;
  if (messages.some((m) => m.role === "system")) return { ok: false, error: "System messages are not accepted." };

  const lines: ChatLine[] = messages.map((m) => ({
    role: m.role as ChatLine["role"],
    text: m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("\n")
      .trim(),
  }));

  const last = lines.at(-1);
  if (!last || last.role !== "user") return { ok: false, error: "The last message must be from the customer." };
  if (!last.text) return { ok: false, error: "Please type a question." };
  if (lines.some((l) => l.role === "user" && l.text.length > MAX_TEXT_CHARS)) {
    return { ok: false, error: `Messages are limited to ${MAX_TEXT_CHARS} characters.` };
  }

  return { ok: true, data: parsed.data, lines };
}
