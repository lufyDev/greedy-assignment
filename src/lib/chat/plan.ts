import { retrieve, searchableWords } from "@/lib/knowledge/retrieve";
import { SEA_VIEW_SOURCE } from "@/lib/knowledge/snapshot";
import type { RetrievedChunk } from "@/lib/knowledge/types";
import { detectMediaRequest, isMediaRequested, PDF_NOUN, VIDEO_NOUN } from "@/lib/media/intent";
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
  /** Set for a safety or policy topic the page doesn't cover: this text is sent and the model is never called. */
  fixedReply: string | null;
};

// Short or pronoun-led messages lean on the previous question ("and the VIP one?").
const FOLLOW_UP = /\b(it|that|this|those|these|they|them|one|ones|same|else|also|instead)\b|^(and|what about|how about)\b/i;

// In a file request these words describe the delivery, not a question for the page
// ("send me a video of the experience" should not cite the package text about video).
const FILE_REQUEST_WORDS = new RegExp(
  `${PDF_NOUN.source}|${VIDEO_NOUN.source}|\\b(send|show|share|see|watch|view|download|open|play|attach|email|e-mail|forward|give|want|like|love|let|thanks|thank|hi|hey|hello|pls|plz|both|too|some|again|experience|jump|sky\\s?div\\w*)\\b`,
  "gi",
);

const FILE_ONLY_CONTEXT = "SOURCES: not needed. The customer only asked for files, so no website text was retrieved.";

export const NOT_COVERED_REPLY =
  "That's an important one and I don't have it on this page, so I won't guess. The Greedy Adventures team can confirm it for you: use Contact us on our website. Happy to help with the packages or the plan for the day in the meantime.";

/**
 * Topics where a guess could hurt someone or cost them money, and which the page
 * doesn't cover. These never reach the model: in testing it invented a weight limit
 * deep in a chat despite its instructions. Everything else is left to the model, so
 * the assistant can still hold a normal conversation.
 */
const SENSITIVE_TOPICS = new RegExp(
  `\\b(?:${[
    "weigh\\w*|kgs?|lbs?|pounds?|overweight|obese|bmi", // weight
    "age|aged|ages|underage|how old|old enough|too old|too young|kids?|child|children|minors?|teen\\w*|elderly", // age
    "\\d{1,3}\\s*(?:years?|yrs?)|i(?:['’]m| am)\\s+\\d{1,3}", // "my 10 year old", "I'm 16"
    "pregnan\\w*|health\\w*|medical|medicine|medication|doctor|disab\\w*|heart|blood pressure|asthma|diabet\\w*|epilep\\w*|seizures?|surgery|injur\\w*|bad (?:back|knees?)|back (?:pain|problems?|issues?)", // health
    "accidents?|fatal\\w*|deaths?|die|dying|killed|risks?|risky", // danger
    "insur\\w*|liabilit\\w*|waivers?|legal", // legal
    "refund\\w*|cancel\\w*|reschedul\\w*|postpone\\w*|deposits?|discounts?|coupons?|promo\\w*", // money back and offers
    "payments?|credit card|debit card|upi|pay (?:by|with|in|via|using|online|cash|upfront|later|at)", // how to pay
    "weather|rain\\w*|windy|storms?|monsoon", // weather
  ].join("|")})\\b`,
  "i",
);

const GENERAL_SECTIONS = new Set(["overview", "highlights"]);

// Someone comparing packages needs all three, or the model fills in a missing price itself.
const PACKAGE_QUESTION = /\b(packages?|pick|choose|compare|difference|options?|prices?|cost)\b/i;
const ALL_PACKAGES = ["package-eco", "package-deluxe", "package-vip"];

export function planTurn(history: ChatLine[]): TurnPlan {
  const userLines = history.filter((l) => l.role === "user");
  const question = userLines.at(-1)?.text.trim() ?? "";
  const previous = userLines.at(-2)?.text.trim();

  const mediaRequest = detectMediaRequest(question);
  const media = isMediaRequested(mediaRequest) ? resolveMedia(mediaRequest) : null;

  const wordCount = question.split(/\s+/).filter(Boolean).length;
  const isFollowUp = !media && Boolean(previous) && (FOLLOW_UP.test(question) || wordCount <= 3);
  const ownQuery = media ? searchableWords(question.replace(FILE_REQUEST_WORDS, " ")) : question;
  const retrievalQuery = isFollowUp ? `${previous} ${question}` : ownQuery;

  const chunks = retrieve(retrievalQuery, PACKAGE_QUESTION.test(retrievalQuery) ? { always: ALL_PACKAGES } : {});
  const context = media && !retrievalQuery ? FILE_ONLY_CONTEXT : formatContext(chunks);

  const fixedReply = !media && SENSITIVE_TOPICS.test(question) ? NOT_COVERED_REPLY : null;

  return { question, isFollowUp, retrievalQuery, chunks, mediaRequest, media, context, fixedReply };
}

export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    // Greetings and open questions like "what can you do?" match nothing, but the model still needs to know the page.
    const summary = SEA_VIEW_SOURCE.sections.filter((s) => GENERAL_SECTIONS.has(s.id)).map((s) => s.text);
    return `SOURCES: nothing on the page matches this message directly. General summary of the page:\n${summary.join("\n")}`;
  }
  const captured = chunks.map(
    (c, i) => `[${i + 1}] ${c.heading} (from "${c.sourceTitle}", ${c.sourceUrl})\n${c.text}`,
  );
  return `SOURCES:\n${captured.join("\n\n")}`;
}
