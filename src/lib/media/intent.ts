import type { MediaRequest, PackageId } from "./types";

/**
 * Rule-based detection of "send me a brochure / show me a video" requests.
 *
 * Kept deterministic on purpose: media selection must be repeatable and
 * testable, so the agent decides *whether* to share files here and the model
 * only writes the words around them.
 */

const PDF_NOUN =
  /\b(brochures?|pdfs?|leaflets?|flyers?|pamphlets?|booklets?|catalog(?:ue)?s?|info(?:rmation)?\s+(?:sheet|pack)|fact\s?sheets?|price\s?list)\b/;
const VIDEO_NOUN = /\b(videos?|clips?|films?|footage|reels?|movies?)\b/;

// Verbs that clearly ask for a file to be delivered.
const STRONG_CUE = /\b(send|show|share|watch|play|download|open|attach|email|e-mail|forward)\b/;
// Softer request phrasing ("can I see", "do you have", "I'd like").
const SOFT_CUE =
  /\b(see|view)\b|\b(can|could|may|would|will)\s+(i|we|you)\s+(please\s+)?(have|get|grab|see|watch|view)\b|\b(give|get)\s+me\b|\b(i|we)(?:'d|\s+would)?\s+(like|love|want|need)\b|\bplease\b|\bdo\s+you\s+have\b|\bis\s+there\b|\bany\b/;
// Questions about what a package contains ("does Deluxe include video?") are
// knowledge questions, not file requests.
const INCLUSION_CUE = /\b(includes?|included|including|comes?\s+with|part\s+of|coverage|covers?)\b/;

const OTHER_EXPERIENCES =
  /\b(paragliding|paraglide|scuba|diving|dive|bungee|bungy|wingsuit|rafting|trek(?:king)?|surf(?:ing)?|snorkel(?:ing|ling)?|zipline)\b/;

const PACKAGES: PackageId[] = ["eco", "deluxe", "vip"];

export function detectMediaRequest(message: string): MediaRequest {
  const text = message.toLowerCase().replace(/[’]/g, "'");
  const mentionsPdf = PDF_NOUN.test(text);
  const mentionsVideo = VIDEO_NOUN.test(text);
  const packages = PACKAGES.filter((p) => new RegExp(`\\b${p}\\b`).test(text));
  const otherExperience = text.match(OTHER_EXPERIENCES)?.[1];

  if (!mentionsPdf && !mentionsVideo) {
    return { pdf: false, video: false, packages, otherExperience };
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const strong = STRONG_CUE.test(text);
  const soft = SOFT_CUE.test(text);
  const isShortAsk = wordCount <= 4; // "brochure please", "and a video?"
  const isInclusionQuestion = INCLUSION_CUE.test(text) && !strong;

  const isRequest = !isInclusionQuestion && (strong || soft || isShortAsk);

  return {
    pdf: isRequest && mentionsPdf,
    video: isRequest && mentionsVideo,
    packages,
    otherExperience,
  };
}

export function isMediaRequested(request: MediaRequest): boolean {
  return request.pdf || request.video;
}
