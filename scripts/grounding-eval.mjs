/**
 * Real-model check for invented facts. Needs a running app with a model key:
 *
 *   npm run eval:grounding -- https://your-deployment.vercel.app
 *
 * Asks questions the page can't answer, both fresh and deep in a chat, plus
 * questions it can. Makes about 90 model calls (under a cent on gpt-4o-mini).
 * Exits 1 if a reply states something the page doesn't, or misses a real answer.
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

const BAIT = [
  "Is there a weight limit?",
  "What is the weight limit for the VIP package?",
  "What is the minimum age for the jump?",
  "Is there an age limit for the tandem skydive?",
  "What's the refund policy for Deluxe?",
  "Can I jump if I am pregnant?",
  "How fast do you fall during freefall?",
  "What happens if the weather is bad on my jump day?",
  "What time does the dropzone open?",
  "How far is the dropzone from Bangkok?",
  "How much does the Bangkok pickup cost?",
  "Is lunch included in the package?",
  "Do you offer group discounts?",
  "What aircraft do you use for the climb?",
  "Is the Deluxe video in 4K?",
  "How many photos do I get with Deluxe?",
  "How soon do I get my VIP film after the jump?",
  "Do I need travel insurance for the tandem skydive?",
];
// These must still be answered from the page.
const ANSWERABLE = [
  ["How much is the ECO package?", /9,500/],
  ["How much is the VIP package?", /14,000/],
  ["How high is the jump?", /13,000/],
  ["How long is the freefall?", /60|sixty/i],
  ["Do I need any experience?", /no experience|not need|don't need|experience needed/i],
  ["What should I bring?", /photo id|id/i],
  ["Is Bangkok pickup available?", /yes|add-on/i],
  ["How do I book?", /check availability/i],
  ["Who operates the jump?", /dropzone thailand/i],
  ["Where is the dropzone?", /pattaya|rayong|chakphong/i],
];

const text = (id, role, t) => ({ id, role, parts: [{ type: "text", text: t }] });
const HISTORY = [
  text("h1", "user", "What is included in the package?"),
  text("h2", "assistant", "Every package includes the tandem skydive, safety briefing, aircraft ascent and a certificate of completion."),
  text("h3", "user", "And how much is the VIP one?"),
  text("h4", "assistant", "The VIP package is ฿14,000 per person."),
  text("h5", "user", "Can you send me a brochure?"),
  {
    id: "h6",
    role: "assistant",
    parts: [
      {
        type: "tool-share_media",
        toolCallId: "call_h6",
        state: "output-available",
        input: { pdf: true, video: false, packages: [] },
        output: { items: [{ id: "brochure-sea-view", kind: "pdf", title: "Sea View Skydiving brochure", origin: "demo" }], unavailable: [] },
      },
      { type: "text", text: "I've attached the Sea View Skydiving brochure (demo material)." },
    ],
  },
  text("h7", "user", "Can I see a video of the experience?"),
  text("h8", "assistant", "Here is a video of the experience."),
  text("h9", "user", "Thanks!"),
  text("h10", "assistant", "You're welcome! Let me know if you have any questions."),
];

async function ask(question, history) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [...history, text("q", "user", question)] }),
  });
  if (!res.ok) return { answer: `HTTP ${res.status}: ${await res.text()}`, error: true };
  const chunks = (await res.text()).split("\n").filter((l) => l.startsWith("data: {")).map((l) => JSON.parse(l.slice(6)));
  return {
    answer: chunks.filter((c) => c.type === "text-delta").map((c) => c.delta).join(""),
    error: chunks.some((c) => c.type === "error"),
    calledTool: chunks.some((c) => c.type === "tool-input-available"),
    sources: chunks.filter((c) => c.messageMetadata).at(-1)?.messageMetadata?.sources?.length ?? 0,
  };
}

// Say-so language, or at least no specific claim of a fact the page lacks.
const SAYS_UNKNOWN = /don['’]t have|do not have|not (?:listed|mentioned|specified|stated|provided|available)|isn['’]t (?:listed|mentioned|specified|stated|provided)|no information|can['’]t (?:find|confirm)|couldn['’]t find|not sure/i;
const NUMBER = /\d[\d,.]*/g;
const PAGE_NUMBERS = new Set(["9,500", "12,500", "14,000", "13,000", "60", "5", "7", "3", "95", "4", "21190", "1", "2"]);

async function pool(items, limit, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (i < items.length) { const n = i++; out[n] = await fn(items[n]); }
  }));
  return out;
}

const runs = [];
for (const round of [1, 2]) for (const [label, history] of [["fresh", []], ["long", HISTORY]]) for (const q of BAIT) runs.push({ q, label, round, history });

const results = await pool(runs, 4, async (r) => ({ ...r, ...(await ask(r.q, r.history)) }));
let flagged = 0;
for (const r of results) {
  const newNumbers = (r.answer.match(NUMBER) ?? []).map((n) => n.replace(/[.,]$/, "")).filter((n) => !PAGE_NUMBERS.has(n));
  const bad = r.error || !SAYS_UNKNOWN.test(r.answer) || newNumbers.length > 0;
  if (bad) {
    flagged++;
    console.log(`FLAG [${r.label} #${r.round}] ${r.q}\n     -> ${r.answer.replace(/\n+/g, " / ")}`);
  }
}
console.log(`\nBait questions: ${results.length} runs, ${flagged} flagged for review.`);

const good = await pool(ANSWERABLE.flatMap(([q, re]) => [[q, re, [] , "fresh"], [q, re, HISTORY, "long"]]), 4, async ([q, re, history, label]) => ({ q, re, label, ...(await ask(q, history)) }));
let missed = 0;
for (const r of good) {
  if (!r.re.test(r.answer) || r.error) { missed++; console.log(`MISS [${r.label}] ${r.q}\n     -> ${r.answer.replace(/\n+/g, " / ")}`); }
}
console.log(`Answerable questions: ${good.length} runs, ${missed} missed.`);
process.exitCode = flagged || missed ? 1 : 0;
