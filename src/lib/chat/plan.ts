import { retrieve } from "@/lib/knowledge/retrieve";
import type { RetrievedChunk } from "@/lib/knowledge/types";
import { detectMediaRequest, isMediaRequested } from "@/lib/media/intent";
import { resolveMedia } from "@/lib/media/resolve";
import type { MediaRequest, MediaSelection } from "@/lib/media/types";

export type ChatLine = { role: "user" | "assistant"; text: string };

/** Everything the agent decided before calling the model. Also what the knowledge view shows. */
export type TurnPlan = {
  question: string;
  isFollowUp: boolean;
  /** Text actually used for retrieval (includes the previous question for follow-ups). */
  retrievalQuery: string;
  chunks: RetrievedChunk[];
  mediaRequest: MediaRequest;
  /** Null when the customer did not ask for a file. */
  media: MediaSelection | null;
  /** The exact source block placed in the system prompt. */
  context: string;
};

// Short or pronoun-led messages lean on the previous question ("and the VIP one?").
const FOLLOW_UP = /\b(it|that|this|those|these|they|them|one|ones|same|else|also|instead)\b|^(and|what about|how about)\b/i;

// In a file request these words describe the delivery, not a question for the page
// ("send me a video of the experience" should not cite the package text about video).
const FILE_REQUEST_WORDS =
  /\b(brochures?|pdfs?|videos?|clips?|films?|footage|reels?|send|show|share|see|watch|view|download|open|play|experience|jump|skydiv\w*)\b/gi;

export function planTurn(history: ChatLine[]): TurnPlan {
  const userLines = history.filter((l) => l.role === "user");
  const question = userLines.at(-1)?.text.trim() ?? "";
  const previous = userLines.at(-2)?.text.trim();

  const mediaRequest = detectMediaRequest(question);
  const media = isMediaRequested(mediaRequest) ? resolveMedia(mediaRequest) : null;

  const wordCount = question.split(/\s+/).filter(Boolean).length;
  const isFollowUp = !media && Boolean(previous) && (FOLLOW_UP.test(question) || wordCount <= 3);
  const ownQuery = media ? question.replace(FILE_REQUEST_WORDS, " ").replace(/\s+/g, " ").trim() : question;
  const retrievalQuery = isFollowUp ? `${previous} ${question}` : ownQuery;

  const chunks = retrieve(retrievalQuery);

  return { question, isFollowUp, retrievalQuery, chunks, mediaRequest, media, context: formatContext(chunks) };
}

export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "SOURCES: none of the captured website text matches this question.";
  const captured = chunks.map(
    (c, i) => `[${i + 1}] ${c.heading} (from "${c.sourceTitle}", ${c.sourceUrl})\n${c.text}`,
  );
  return `SOURCES:\n${captured.join("\n\n")}`;
}
