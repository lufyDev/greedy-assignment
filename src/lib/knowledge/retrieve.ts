import { WEBSITE_SOURCES } from "./snapshot";
import type { RetrievedChunk, WebsiteSource } from "./types";

/**
 * Keyword retrieval (BM25) over the captured page sections.
 *
 * The knowledge base is ~10 short sections, so a transparent keyword ranker is
 * enough and keeps every result explainable in the knowledge view. Synonyms
 * map customer wording ("how much", "film") onto the page's wording.
 */

const STOPWORDS = new Set(
  "a about an and any are as at be by can could do does for from get got have how i if in is it its know me my need of on or our please should so take tell than that the their them there these this those to us was we what when which who will with would you your".split(
    " ",
  ),
);

const SYNONYMS: Record<string, string[]> = {
  price: ["฿", "per", "person", "eco", "deluxe", "vip"],
  cost: ["price"],
  much: ["price"],
  fee: ["price"],
  baht: ["price"],
  thb: ["price"],
  expensive: ["price"],
  cheap: ["price"],
  come: ["included"],
  option: ["package"],
  video: ["handy", "cam", "media", "film", "cameraman"],
  film: ["video"],
  footage: ["video"],
  photo: ["media", "video"],
  picture: ["photo"],
  camera: ["cam", "cameraman", "video"],
  gopro: ["handy", "cam"],
  height: ["altitude", "ft"],
  high: ["altitude"],
  altitude: ["13,000", "ft"],
  fall: ["freefall"],
  long: ["seconds", "minutes", "hours"],
  duration: ["long"],
  time: ["hours", "minutes"],
  where: ["location", "pattaya", "address"],
  location: ["where", "address", "pattaya"],
  address: ["location"],
  pickup: ["bangkok", "add-on"],
  transfer: ["pickup"],
  transport: ["pickup"],
  hotel: ["pickup"],
  bring: ["photo", "id"],
  id: ["photo", "check-in"],
  experience: ["needed"],
  beginner: ["experience", "needed"],
  first: ["experience", "needed"],
  safe: ["safety", "certified", "uspa"],
  safety: ["briefing"],
  instructor: ["certified", "uspa"],
  step: ["plan"],
  process: ["plan", "step"],
  happen: ["plan", "step"],
  operator: ["operated"],
  certificate: ["completion"],
  recommend: ["choose"],
  best: ["choose"],
  choose: ["package"],
};

const HEADING_BOOST = 1.5;
const K1 = 1.2;
const B = 0.75;

/** Lower-cases, strips punctuation (keeping ฿ and digits), drops stopwords, light stemming. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/฿/g, " ฿ ")
    .split(/[^a-z0-9฿,\-]+/)
    .map((t) => t.replace(/^[,\-]+|[,\-]+$/g, ""))
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
    .map(stem);
}

/** Crude suffix stripping so "includes", "included" and "include" meet at "includ". */
function stem(token: string): string {
  let t = token;
  if (t.length > 4 && t.endsWith("ies")) t = t.slice(0, -3) + "y";
  else if (t.length > 5 && t.endsWith("ing")) t = t.slice(0, -3);
  else if (t.length > 4 && t.endsWith("ed")) t = t.slice(0, -2);
  else if (t.length > 4 && t.endsWith("es")) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
  if (t.length > 4 && t.endsWith("e")) t = t.slice(0, -1);
  return t;
}

const STEMMED_SYNONYMS = new Map(Object.entries(SYNONYMS).map(([word, syns]) => [stem(word), syns]));

/**
 * Query tokens plus synonym expansion, two hops deep so "cost" → "price" → "฿".
 * Direct terms weigh 1, first-hop synonyms 0.5, second-hop 0.25.
 */
function expandQuery(query: string): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (term: string, w: number, depth: number) => {
    if ((weights.get(term) ?? 0) >= w) return;
    weights.set(term, w);
    if (depth >= 2) return;
    for (const syn of STEMMED_SYNONYMS.get(term) ?? []) {
      for (const t of tokenize(syn)) add(t, w / 2, depth + 1);
    }
  };
  for (const token of tokenize(query)) add(token, 1, 0);
  return weights;
}

type IndexedChunk = { chunk: Omit<RetrievedChunk, "score">; terms: string[]; headingTerms: Set<string> };

function buildIndex(sources: WebsiteSource[]): IndexedChunk[] {
  return sources.flatMap((source) =>
    source.sections.map((section) => ({
      chunk: {
        chunkId: `${source.id}#${section.id}`,
        sourceId: source.id,
        sourceTitle: source.title,
        sourceUrl: source.url,
        heading: section.heading,
        text: section.text,
      },
      terms: tokenize(`${section.heading} ${section.text}`),
      headingTerms: new Set(tokenize(section.heading)),
    })),
  );
}

const DEFAULT_INDEX = buildIndex(WEBSITE_SOURCES);

export type RetrieveOptions = { limit?: number; minScore?: number; index?: IndexedChunk[] };

export function retrieve(query: string, { limit = 5, minScore = 0.5, index = DEFAULT_INDEX }: RetrieveOptions = {}): RetrievedChunk[] {
  const queryTerms = expandQuery(query);
  if (queryTerms.size === 0) return [];

  const avgLen = index.reduce((sum, c) => sum + c.terms.length, 0) / index.length;
  const docFreq = new Map<string, number>();
  for (const c of index) {
    for (const term of new Set(c.terms)) docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
  }

  return index
    .map(({ chunk, terms, headingTerms }) => {
      const tf = new Map<string, number>();
      for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);

      let score = 0;
      for (const [term, weight] of queryTerms) {
        const f = tf.get(term);
        if (!f) continue;
        const df = docFreq.get(term) ?? 0;
        const idf = Math.log(1 + (index.length - df + 0.5) / (df + 0.5));
        const norm = f + K1 * (1 - B + (B * terms.length) / avgLen);
        score += weight * idf * ((f * (K1 + 1)) / norm) * (headingTerms.has(term) ? HEADING_BOOST : 1);
      }
      return { ...chunk, score: Math.round(score * 100) / 100 };
    })
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
