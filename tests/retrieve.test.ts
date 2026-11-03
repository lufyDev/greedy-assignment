import { describe, expect, it } from "vitest";
import { retrieve } from "@/lib/knowledge/retrieve";

const top = (query: string) => retrieve(query).map((c) => c.chunkId.split("#")[1]);

describe("retrieve", () => {
  it.each([
    ["What is included in the package?", "whats-included"],
    ["How much does the VIP package cost?", "package-vip"],
    ["Is Bangkok pickup available?", "faq-bangkok-pickup"],
    ["How high do we jump from?", "the-plan|highlights"],
    ["Where is the dropzone?", "location"],
    ["Which package should I choose?", "faq-which-package"],
    ["Do I need experience?", "highlights"],
    ["What should I bring?", "the-plan"],
  ])("%j ranks %s first", (query, expected) => {
    expect(expected.split("|")).toContain(top(query)[0]);
  });

  it("returns nothing for topics the page does not cover", () => {
    expect(retrieve("Is there a weight limit?")).toEqual([]);
    expect(retrieve("Can I pay with crypto?")).toEqual([]);
  });

  it("does not read the contraction I'd as the word ID", () => {
    expect(top("I'd like a refund")).toEqual([]);
    expect(top("What ID should I bring?")[0]).toBe("the-plan");
  });

  it("ignores filler words that happen to appear in an answer", () => {
    expect(top("yes please")).toEqual([]);
    expect(top("ok then")).toEqual([]);
    expect(top("no")).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    expect(retrieve("   ")).toEqual([]);
  });
});
