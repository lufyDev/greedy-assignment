import type { MediaSelection } from "@/lib/media/types";
import type { TurnPlan } from "./plan";

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
  if (!best) return plan.fixedReply ?? "Happy to help. Ask me anything about Sea View Skydiving.";
  return `From the Sea View Skydiving page (${best.heading}): ${best.text}`;
}
