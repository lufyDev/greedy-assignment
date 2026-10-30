import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import { describe, expect, it } from "vitest";
import { streamReply, traceTurn, type ChatUIMessage } from "@/lib/chat/agent";
import { planTurn } from "@/lib/chat/plan";

/**
 * Exercises the real model path (streamText / generateText, tools, prepareStep)
 * with a scripted model, so agent behaviour is checked without an API key.
 */

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const toolCallStep = (input: object) => ({
  content: [{ type: "tool-call" as const, toolCallId: "call_1", toolName: "share_media", input: JSON.stringify(input) }],
  finishReason: { unified: "tool-calls" as const, raw: undefined },
  usage,
  warnings: [],
});

const textStep = (text: string) => ({
  content: [{ type: "text" as const, text }],
  finishReason: { unified: "stop" as const, raw: undefined },
  usage,
  warnings: [],
});

const systemText = (model: MockLanguageModelV4, call = 0) =>
  model.doGenerateCalls[call].prompt.filter((m) => m.role === "system").map((m) => m.content).join("\n");

describe("traceTurn with a model", () => {
  it("forces share_media for a file request and uses the planned selection", async () => {
    const model = new MockLanguageModelV4({
      // The model asks for the wrong thing on purpose: the rules' selection must win.
      doGenerate: [toolCallStep({ pdf: false, video: true, packages: ["vip"] }), textStep("Here you go.")],
    });
    const trace = await traceTurn(planTurn([{ role: "user", text: "Send me the brochure and a video." }]), { model });

    expect(model.doGenerateCalls[0].toolChoice).toEqual({ type: "tool", toolName: "share_media" });
    expect(model.doGenerateCalls[1].toolChoice).toEqual({ type: "none" });
    expect(trace.mediaSelectedBy).toBe("rules");
    expect(trace.media?.items.map((m) => m.id)).toEqual(["brochure-sea-view", "video-sea-view-film"]);
    expect(trace.answer).toBe("Here you go.");
  });

  it("lets the model pick media itself when the rules saw no request", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [toolCallStep({ pdf: false, video: true, packages: ["vip"] }), textStep("Here's the VIP preview.")],
    });
    const trace = await traceTurn(planTurn([{ role: "user", text: "What does the VIP film look like?" }]), { model });

    expect(model.doGenerateCalls[0].toolChoice).toEqual({ type: "auto" });
    expect(trace.mediaSelectedBy).toBe("model");
    expect(trace.media?.items.map((m) => m.id)).toEqual(["video-vip-preview"]);
  });

  it("passes only the retrieved source text to the model", async () => {
    const model = new MockLanguageModelV4({ doGenerate: textStep("Yes, as a fixed-price add-on.") });
    const trace = await traceTurn(planTurn([{ role: "user", text: "Is Bangkok pickup available?" }]), { model });

    const system = systemText(model);
    expect(system).toContain(trace.contextPassedToModel);
    expect(system).toContain("Bangkok pickup is available as a fixed-price add-on");
    expect(system).not.toContain("฿14,000");
  });

  it("reports a model failure instead of an answer", async () => {
    const trace = await traceTurn(planTurn([{ role: "user", text: "What is included?" }]), { simulate: "model-error" });
    expect(trace.answer).toBeNull();
    expect(trace.error).toMatch(/couldn't reach the assistant/);
  });
});

describe("streamReply with a model", () => {
  const userMessage = (id: string, text: string): ChatUIMessage => ({ id, role: "user", parts: [{ type: "text", text }] });

  async function readStream(res: Response) {
    return (await res.text())
      .split("\n")
      .filter((l) => l.startsWith("data: {"))
      .map((l) => JSON.parse(l.slice(6)));
  }

  it("streams text with source metadata and sends the whole conversation", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "Deluxe is ฿12,500." },
            { type: "text-end", id: "t" },
            { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
          ],
        }),
      }),
    });
    const messages: ChatUIMessage[] = [
      userMessage("1", "How much is VIP?"),
      { id: "2", role: "assistant", parts: [{ type: "text", text: "฿14,000 per person." }] },
      userMessage("3", "and the deluxe one?"),
    ];
    const plan = planTurn(messages.map((m) => ({ role: m.role as "user" | "assistant", text: (m.parts[0] as { text: string }).text })));
    const chunks = await readStream(await streamReply({ plan, messages, model }));

    const start = chunks.find((c) => c.type === "start");
    expect(start.messageMetadata.sources.map((s: { chunkId: string }) => s.chunkId)).toContain("sea-view-skydiving#package-deluxe");
    expect(chunks.filter((c) => c.type === "text-delta").map((c) => c.delta).join("")).toBe("Deluxe is ฿12,500.");
    // Memory: all three turns reach the model.
    expect(model.doStreamCalls[0].prompt.filter((m) => m.role !== "system")).toHaveLength(3);
  });

  it("turns a model failure into an error chunk the chat can show", async () => {
    const plan = planTurn([{ role: "user", text: "hi" }]);
    const chunks = await readStream(await streamReply({ plan, messages: [userMessage("1", "hi")], simulate: "model-error" }));
    expect(chunks.find((c) => c.type === "error")?.errorText).toMatch(/couldn't reach the assistant/);
  });
});
