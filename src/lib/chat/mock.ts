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
  if (!best) {
    return "I couldn't find that on the Sea View Skydiving page, so I don't want to guess. The Greedy Adventures team can help with anything not covered there.";
  }
  return `From the Sea View Skydiving page (${best.heading}): ${best.text}`;
}
