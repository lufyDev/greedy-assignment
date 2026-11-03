import type { MediaSelection } from "@/lib/media/types";
import { NOT_COVERED_REPLY, type TurnPlan } from "./plan";

const CHAT_WORDS = new Set(
  "hi hello hey hiya namaste thanks thank you thx ty ok okay cool great nice awesome perfect good morning afternoon evening bye goodbye yes yeah yep sure no nope please pls what can do help".split(" "),
);

function isSmallTalk(text: string): boolean {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.length > 0 && words.every((word) => CHAT_WORDS.has(word));
}

/**
 * Deterministic answer used in mock mode (no model key configured). It only
 * quotes retrieved source text, so it shows the agent flow without an LLM.
 */
export function mockAnswer(plan: TurnPlan, media: MediaSelection | null): string {
  const parts: string[] = [];

  if (media) {
    const pdf = media.items.find((m) => m.kind === "pdf");
    const videos = media.items.filter((m) => m.kind === "video");
    if (pdf) parts.push(`Here's the ${pdf.title} (demo material).`);
    if (videos.length) parts.push(`Here ${videos.length > 1 ? "are the videos" : "is a video"}: ${videos.map((v) => v.title).join(" and ")}.`);
    // The card already explains each missing file; the text just acknowledges it.
    if (media.unavailable.length) parts.push("Sorry, I don't have that file to share, see the note above.");
    return parts.join(" ");
  }

  const [best] = plan.chunks;
  if (!best) {
    return isSmallTalk(plan.question)
      ? "Happy to help. Ask me about the packages, the plan for the day or pickup, or ask for the brochure or a video."
      : (plan.fixedReply ?? NOT_COVERED_REPLY);
  }
  return `From the Sea View Skydiving page (${best.heading}): ${best.text}`;
}
