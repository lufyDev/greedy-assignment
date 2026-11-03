import "server-only";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  type LanguageModel,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod";
import { resolveMedia } from "@/lib/media/resolve";
import type { MediaSelection } from "@/lib/media/types";
import { mockAnswer } from "./mock";
import { getLanguageModel, getModelInfo, type ModelInfo } from "./model";
import type { TurnPlan } from "./plan";
import { buildSystemPrompt, GROUNDING_REMINDER, isRefusal } from "./prompt";

export const SHARE_MEDIA_TOOL = "share_media" as const;

/** Metadata attached to every assistant reply (read in the chat UI). */
export type ReplyMetadata = {
  mode: "openai" | "mock";
  model: string | null;
  sources: { chunkId: string; heading: string; title: string; url: string }[];
};

export type ChatUIMessage = UIMessage<ReplyMetadata>;

export type Simulation = "model-error" | undefined;

const shareMediaInput = z.object({
  pdf: z.boolean().describe("Share the brochure PDF"),
  video: z.boolean().describe("Share a video"),
  packages: z
    .array(z.enum(["eco", "deluxe", "vip"]))
    .describe("Packages the customer named, to pick a package video")
    .default([]),
});

/**
 * The share_media tool. When the rules already detected a file request the
 * planned selection is authoritative (repeatable); otherwise the model's own
 * input is resolved against the catalog.
 */
function createTools(plan: TurnPlan, onSelect: (selection: MediaSelection, by: "rules" | "model") => void) {
  return {
    [SHARE_MEDIA_TOOL]: tool({
      description:
        "Show the Sea View Skydiving brochure PDF and/or a video in the chat. Call this whenever the customer asks for a brochure, PDF, video, clip or film.",
      inputSchema: shareMediaInput,
      execute: async (input): Promise<MediaSelection> => {
        if (plan.media) {
          onSelect(plan.media, "rules");
          return plan.media;
        }
        const selection = resolveMedia({ ...input, otherExperience: plan.mediaRequest.otherExperience });
        onSelect(selection, "model");
        return selection;
      },
    }),
  };
}

export type AgentTools = ReturnType<typeof createTools>;

function failingModel(): LanguageModel {
  const fail = async () => {
    throw new Error("Simulated model failure");
  };
  return new MockLanguageModelV4({ provider: "simulated", modelId: "failure", doGenerate: fail, doStream: fail });
}

/** `model` overrides the configured model (used by tests with a mock language model). */
type AgentOptions = { simulate?: Simulation; model?: LanguageModel };

function agentConfig(plan: TurnPlan, { simulate, model: override }: AgentOptions, onSelect: Parameters<typeof createTools>[1]) {
  const configured = getModelInfo();
  const info: ModelInfo = override ? { mode: "openai", modelId: "override", label: "Injected model" } : configured;
  const tools = createTools(plan, onSelect);
  const model =
    simulate === "model-error"
      ? failingModel()
      : (override ?? (configured.mode === "openai" ? getLanguageModel(configured.modelId) : null));
  return {
    info,
    tools,
    model,
    instructions: buildSystemPrompt(plan),
    // Force the media tool on the first step when the rules found a file request,
    // then stop tools so the model just writes the reply.
    prepareStep: ({ stepNumber }: { stepNumber: number }) => {
      if (!plan.media) return undefined;
      return stepNumber === 0
        ? ({ toolChoice: { type: "tool", toolName: SHARE_MEDIA_TOOL } } as const)
        : ({ toolChoice: "none" } as const);
    },
  };
}

function replyMetadata(plan: TurnPlan, info: ModelInfo): ReplyMetadata {
  return {
    mode: info.mode,
    model: info.modelId,
    sources: plan.chunks.map((c) => ({ chunkId: c.chunkId, heading: c.heading, title: c.sourceTitle, url: c.sourceUrl })),
  };
}

const FRIENDLY_ERROR = "Sorry, I couldn't reach the assistant just now. Please try again in a moment.";

/** Adds the grounding reminder after the customer's latest message, where it can't fade as the chat grows. */
function withGroundingReminder(messages: ModelMessage[]): ModelMessage[] {
  const last = messages.at(-1);
  if (last?.role !== "user") return messages;
  const content = typeof last.content === "string" ? [{ type: "text" as const, text: last.content }] : last.content;
  return [...messages.slice(0, -1), { ...last, content: [...content, { type: "text", text: GROUNDING_REMINDER }] }];
}

/** Streams one assistant reply in the AI SDK UI message protocol (what assistant-ui consumes). */
export async function streamReply({
  plan,
  messages,
  abortSignal,
  ...options
}: AgentOptions & {
  plan: TurnPlan;
  messages: ChatUIMessage[];
  abortSignal?: AbortSignal;
}): Promise<Response> {
  const cfg = agentConfig(plan, options, () => {});
  const metadata = replyMetadata(plan, cfg.info);

  if (plan.fixedReply && !options.simulate) {
    return createUIMessageStreamResponse({ stream: fixedStream(plan, metadata, plan.fixedReply) });
  }
  if (!cfg.model) return createUIMessageStreamResponse({ stream: fixedStream(plan, metadata, mockAnswer(plan, plan.media)) });

  const result = streamText({
    model: cfg.model,
    instructions: cfg.instructions,
    // A reply stopped mid-tool-call leaves a call with no result; skip it so the next turn still works.
    messages: withGroundingReminder(await convertToModelMessages(messages, { tools: cfg.tools, ignoreIncompleteToolCalls: true })),
    tools: cfg.tools,
    prepareStep: cfg.prepareStep,
    stopWhen: isStepCount(3),
    maxRetries: 1,
    temperature: 0,
    abortSignal,
    onError: ({ error }) => console.error("[chat] model error:", error),
  });

  let replyText = "";
  return createUIMessageStreamResponse({
    stream: toUIMessageStream<AgentTools, ChatUIMessage>({
      stream: result.stream,
      tools: cfg.tools,
      originalMessages: messages,
      sendReasoning: false,
      messageMetadata: ({ part }) => {
        if (part.type === "start") return metadata;
        if (part.type === "text-delta") replyText += part.text;
        if (part.type === "finish" && isRefusal(replyText)) return { ...metadata, sources: [] };
        return undefined;
      },
      onError: () => FRIENDLY_ERROR,
    }),
  });
}

/** Fixed replies and mock mode: same plan and wire format, set text instead of an LLM. */
function fixedStream(plan: TurnPlan, metadata: ReplyMetadata, answer: string) {
  return createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "start", messageMetadata: isRefusal(answer) ? { ...metadata, sources: [] } : metadata });
      if (plan.media) {
        const toolCallId = `mock-${crypto.randomUUID()}`;
        writer.write({ type: "start-step" });
        writer.write({ type: "tool-input-available", toolCallId, toolName: SHARE_MEDIA_TOOL, input: plan.mediaRequest });
        writer.write({ type: "tool-output-available", toolCallId, output: plan.media });
        writer.write({ type: "finish-step" });
      }
      writer.write({ type: "start-step" });
      writer.write({ type: "text-start", id: "mock-text" });
      for (const word of answer.split(/(?<=\s)/)) {
        writer.write({ type: "text-delta", id: "mock-text", delta: word });
        await new Promise((r) => setTimeout(r, 12));
      }
      writer.write({ type: "text-end", id: "mock-text" });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish", finishReason: "stop" });
    },
    onError: () => FRIENDLY_ERROR,
  });
}

/** What the knowledge view shows for a test question. */
export type TurnTrace = {
  mode: "openai" | "mock";
  model: string | null;
  question: string;
  retrievalQuery: string;
  chunks: TurnPlan["chunks"];
  contextPassedToModel: string;
  instructions: string;
  mediaRequest: TurnPlan["mediaRequest"];
  media: MediaSelection | null;
  mediaSelectedBy: "rules" | "model" | null;
  /** True when nothing on the page matched, so the model was not called. */
  usedFixedReply: boolean;
  answer: string | null;
  error: string | null;
  durationMs: number;
};

/** Runs the same agent once, non-streaming, and records what happened. */
export async function traceTurn(plan: TurnPlan, options: AgentOptions = {}): Promise<TurnTrace> {
  const started = Date.now();
  let media: MediaSelection | null = null;
  let mediaSelectedBy: TurnTrace["mediaSelectedBy"] = null;
  const cfg = agentConfig(plan, options, (selection, by) => {
    media = selection;
    mediaSelectedBy = by;
  });

  const base = {
    mode: cfg.info.mode,
    model: cfg.info.modelId,
    question: plan.question,
    retrievalQuery: plan.retrievalQuery,
    chunks: plan.chunks,
    contextPassedToModel: plan.context,
    instructions: `${cfg.instructions}\n\nAdded after the customer's message:\n${GROUNDING_REMINDER}`,
    mediaRequest: plan.mediaRequest,
    usedFixedReply: false,
  };

  if (plan.fixedReply && !options.simulate) {
    return { ...base, usedFixedReply: true, media: null, mediaSelectedBy: null, answer: plan.fixedReply, error: null, durationMs: Date.now() - started };
  }

  if (!cfg.model) {
    return {
      ...base,
      media: plan.media,
      mediaSelectedBy: plan.media ? "rules" : null,
      answer: mockAnswer(plan, plan.media),
      error: null,
      durationMs: Date.now() - started,
    };
  }

  try {
    const result = await generateText({
      model: cfg.model,
      instructions: cfg.instructions,
      messages: withGroundingReminder([{ role: "user", content: plan.question }]),
      tools: cfg.tools,
      prepareStep: cfg.prepareStep,
      stopWhen: isStepCount(3),
      maxRetries: 1,
      temperature: 0,
    });
    return { ...base, media, mediaSelectedBy, answer: result.text, error: null, durationMs: Date.now() - started };
  } catch (err) {
    console.error("[inspect] model error:", err);
    return { ...base, media, mediaSelectedBy, answer: null, error: FRIENDLY_ERROR, durationMs: Date.now() - started };
  }
}
