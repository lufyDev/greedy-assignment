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

  it("does not call the model for a safety topic the page doesn't cover, so it can't guess", async () => {
    const model = new MockLanguageModelV4({ doGenerate: textStep("The maximum weight is 100 kg.") });
    const trace = await traceTurn(planTurn([{ role: "user", text: "Is there a weight limit?" }]), { model });

    expect(model.doGenerateCalls).toHaveLength(0);
    expect(trace.usedFixedReply).toBe(true);
    expect(trace.answer).toMatch(/don't have it on this page/);
    expect(trace.answer).not.toMatch(/100 kg/);
  });

  it("repeats the grounding rule right after the customer's message", async () => {
    const model = new MockLanguageModelV4({ doGenerate: textStep("I don't have that detail on this page.") });
    await traceTurn(planTurn([{ role: "user", text: "How fast do you fall during freefall?" }]), { model });

    const last = model.doGenerateCalls[0].prompt.at(-1);
    expect(last?.role).toBe("user");
    expect(JSON.stringify(last?.content)).toContain("How fast do you fall during freefall?");
    expect(JSON.stringify(last?.content)).toContain("Never guess");
  });

  it("lets the model answer normal conversation that matches nothing on the page", async () => {
    const model = new MockLanguageModelV4({ doGenerate: textStep("I can tell you about the packages, the plan for the day and more.") });
    const trace = await traceTurn(planTurn([{ role: "user", text: "Hi, what can you do" }]), { model });

    expect(model.doGenerateCalls).toHaveLength(1);
    expect(trace.usedFixedReply).toBe(false);
    expect(systemText(model)).toContain("General summary of the page");
  });

  it("replaces a reply that states a number not on the page", async () => {
    const model = new MockLanguageModelV4({ doGenerate: textStep("You reach speeds of around 120 mph!") });
    const trace = await traceTurn(planTurn([{ role: "user", text: "How fast do you fall during freefall?" }]), { model });
    expect(trace.answer).not.toContain("120");
    expect(trace.answer).toMatch(/don't have that detail/);
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

  const streamingModel = (...deltas: string[]) =>
    new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start" as const, id: "t" },
            ...deltas.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
            { type: "text-end" as const, id: "t" },
            { type: "finish" as const, finishReason: { unified: "stop" as const, raw: undefined }, usage },
          ],
        }),
      }),
    });
  const streamedText = (chunks: { type: string; delta?: string }[]) => chunks.filter((c) => c.type === "text-delta").map((c) => c.delta).join("");

  it("never streams an invented number, even split across chunks", async () => {
    const plan = planTurn([{ role: "user", text: "How fast do you fall during freefall?" }]);
    const model = streamingModel("You reach around 1", "20 mph, ", "what a thrill!");
    const chunks = await readStream(await streamReply({ plan, messages: [userMessage("1", plan.question)], model }));

    expect(streamedText(chunks)).not.toContain("120");
    expect(streamedText(chunks)).toMatch(/don't have that detail/);
    expect(chunks.filter((c) => c.messageMetadata).at(-1)?.messageMetadata.sources).toEqual([]);
  });

  it("lets a reply through when its numbers are on the page", async () => {
    const plan = planTurn([{ role: "user", text: "How high is the jump?" }]);
    const model = streamingModel("You exit at ", "13,000 ft, ", "what a view!");
    const chunks = await readStream(await streamReply({ plan, messages: [userMessage("1", plan.question)], model }));
    expect(streamedText(chunks)).toBe("You exit at 13,000 ft, what a view!");
  });

  it("sends the fixed reply in a long chat without calling the model", async () => {
    const model = new MockLanguageModelV4({ doStream: async () => { throw new Error("must not be called"); } });
    const messages: ChatUIMessage[] = [
      userMessage("1", "How much is VIP?"),
      { id: "2", role: "assistant", parts: [{ type: "text", text: "฿14,000 per person." }] },
      userMessage("3", "Is there a weight limit?"),
    ];
    const plan = planTurn([{ role: "user", text: "How much is VIP?" }, { role: "assistant", text: "฿14,000 per person." }, { role: "user", text: "Is there a weight limit?" }]);
    const chunks = await readStream(await streamReply({ plan, messages, model }));

    expect(model.doStreamCalls).toHaveLength(0);
    expect(chunks.filter((c) => c.type === "text-delta").map((c) => c.delta).join("")).toMatch(/don't have it on this page/);
    expect(chunks.find((c) => c.type === "start").messageMetadata.sources).toEqual([]);
  });

  it("still shows the failure path for a no-match question when simulating", async () => {
    const plan = planTurn([{ role: "user", text: "Is there a weight limit?" }]);
    const chunks = await readStream(await streamReply({ plan, messages: [userMessage("1", plan.question)], simulate: "model-error" }));
    expect(chunks.find((c) => c.type === "error")?.errorText).toMatch(/couldn't reach the assistant/);
  });

  it("drops the source links when the reply says it doesn't have the answer", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "I don't have " },
            { type: "text-delta", id: "t", delta: "the delivery time on this page." },
            { type: "text-end", id: "t" },
            { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
          ],
        }),
      }),
    });
    const plan = planTurn([{ role: "user", text: "When do I get my VIP film?" }]);
    expect(plan.chunks.length).toBeGreaterThan(0);
    const chunks = await readStream(await streamReply({ plan, messages: [userMessage("1", plan.question)], model }));

    const metadataChunks = chunks.filter((c) => c.messageMetadata);
    expect(metadataChunks.at(0)?.messageMetadata.sources.length).toBeGreaterThan(0);
    expect(metadataChunks.at(-1)?.messageMetadata.sources).toEqual([]);
  });

  it("keeps working after a reply was stopped mid-tool-call or failed empty", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "฿14,000." },
            { type: "text-end", id: "t" },
            { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
          ],
        }),
      }),
    });
    const messages: ChatUIMessage[] = [
      userMessage("1", "Send me a video"),
      // Stopped by the customer: the tool call never got a result.
      {
        id: "2",
        role: "assistant",
        parts: [{ type: "tool-share_media", toolCallId: "call_1", state: "input-available", input: { pdf: false, video: true, packages: [] } }],
      },
      userMessage("3", "Sorry, how much is VIP?"),
      // Failed before any output.
      { id: "4", role: "assistant", parts: [] },
      userMessage("5", "How much is VIP?"),
    ];
    const plan = planTurn([{ role: "user", text: "How much is VIP?" }]);
    const chunks = await readStream(await streamReply({ plan, messages, model }));

    expect(chunks.find((c) => c.type === "error")).toBeUndefined();
    expect(chunks.filter((c) => c.type === "text-delta").map((c) => c.delta).join("")).toBe("฿14,000.");
    const sent = JSON.stringify(model.doStreamCalls[0].prompt);
    expect(sent).not.toContain("call_1");
  });

  it("turns a model failure into an error chunk the chat can show", async () => {
    const plan = planTurn([{ role: "user", text: "hi" }]);
    const chunks = await readStream(await streamReply({ plan, messages: [userMessage("1", "hi")], simulate: "model-error" }));
    expect(chunks.find((c) => c.type === "error")?.errorText).toMatch(/couldn't reach the assistant/);
  });
});
