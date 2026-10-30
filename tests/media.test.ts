import { describe, expect, it } from "vitest";
import { detectMediaRequest } from "@/lib/media/intent";
import { resolveMedia } from "@/lib/media/resolve";

const ids = (message: string) => resolveMedia(detectMediaRequest(message)).items.map((m) => m.id);

describe("media selection (brief scenarios)", () => {
  it("answers 'what is included' in text only", () => {
    expect(ids("What is included in the package?")).toEqual([]);
  });

  it("shares the brochure PDF when asked", () => {
    expect(ids("Can you send me a brochure?")).toEqual(["brochure-sea-view"]);
  });

  it("shares a video when asked to see one", () => {
    expect(ids("Can I see a video of the experience?")).toEqual(["video-sea-view-film"]);
  });

  it("shares both when asked for brochure and video", () => {
    expect(ids("Send me the brochure and a video.")).toEqual(["brochure-sea-view", "video-sea-view-film"]);
  });
});

describe("media selection (edge cases)", () => {
  it.each([
    ["Does the Deluxe package include video?", []],
    ["Which package gives me a video?", []],
    ["Is video coverage part of VIP?", []],
    ["How much is the brochure price for VIP?", []],
  ])("treats %j as a knowledge question, not a file request", (message, expected) => {
    expect(ids(message)).toEqual(expected);
  });

  it.each([
    ["brochure please", ["brochure-sea-view"]],
    ["and a video?", ["video-sea-view-film"]],
    ["Do you have a PDF I can download?", ["brochure-sea-view"]],
    ["Show me the VIP video", ["video-vip-preview"]],
    ["Can I watch the deluxe and VIP videos?", ["video-deluxe-preview", "video-vip-preview"]],
  ])("treats %j as a file request", (message, expected) => {
    expect(ids(message)).toEqual(expected);
  });

  it("reports an ECO video as unavailable instead of substituting another", () => {
    const result = resolveMedia(detectMediaRequest("Can I see an ECO video?"));
    expect(result.items).toEqual([]);
    expect(result.unavailable).toEqual([{ kind: "video", reason: expect.stringContaining("no video coverage") }]);
  });

  it("reports files for other activities as unavailable", () => {
    const result = resolveMedia(detectMediaRequest("Send me the paragliding brochure"));
    expect(result.items).toEqual([]);
    expect(result.unavailable[0]).toMatchObject({ kind: "pdf", reason: expect.stringContaining("paragliding") });
  });

  it("reports a missing file when the catalog has none", () => {
    const result = resolveMedia(detectMediaRequest("send me a video"), []);
    expect(result.items).toEqual([]);
    expect(result.unavailable).toHaveLength(1);
  });
});
