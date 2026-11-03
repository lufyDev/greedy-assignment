/**
 * Real-model check for invented facts. Needs a running app with a model key:
 *
 *   npm run eval:grounding -- https://your-deployment.vercel.app
 *
 * Asks questions the page can't answer, questions it can, and normal conversation,
 * both fresh and deep in a chat. Makes about 140 model calls (about a cent on
 * gpt-4o-mini). Exits 1 if a reply states something the page doesn't, misses a real
 * answer, or refuses to chat.
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
  "I am 16, can I jump?",
  "I weigh 120 kg, is that ok?",
  "I have a bad back, can I still do it?",
  "What is the accident rate?",
  "What equipment brand do you use?",
  "How many jumps has my instructor done?",
];
// Normal conversation must get a real reply, not a refusal.
const CONVERSATION = [
  "hi",
  "what can you do",
  "Hi, what can you do?",
  "Is the jump exciting?",
  "I'm nervous about my first jump",
  "Why should I try this?",
  "Tell me about the experience",
  "Which package is best for a first timer?",
  "Is it worth paying for VIP?",
  "What should I expect on the day?",
  "What's so special about this jump?",
  "Can you help me pick a package?",
  "Thanks, that was helpful",
  "Is it safe?",
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
const UNSUPPORTED_CLAIM = /\b(popular|the safest|guarantee\w*|100%|safety is (?:a |our )?(?:top )?priority|experienced instructors?)\b/i;
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

const chat = await pool(CONVERSATION.flatMap((q) => [[q, [], "fresh"], [q, HISTORY, "long"]]), 4, async ([q, history, label]) => ({ q, label, ...(await ask(q, history)) }));
let refused = 0;
for (const r of chat) {
  const newNumbers = (r.answer.match(NUMBER) ?? []).map((n) => n.replace(/[.,]$/, "")).filter((n) => !PAGE_NUMBERS.has(n));
  if (r.error || SAYS_UNKNOWN.test(r.answer) || UNSUPPORTED_CLAIM.test(r.answer) || newNumbers.length > 0) {
    refused++;
    console.log(`CHAT [${r.label}] ${r.q}\n     -> ${r.answer.replace(/\n+/g, " / ")}`);
  }
}
console.log(`Conversation: ${chat.length} runs, ${refused} refused or made a claim not on the page.`);
if (process.argv.includes("--show")) {
  for (const r of chat.filter((c) => c.label === "long")) console.log(`\nQ: ${r.q}\nA: ${r.answer.replace(/\n+/g, " / ")}`);
}
process.exitCode = flagged || missed || refused ? 1 : 0;
