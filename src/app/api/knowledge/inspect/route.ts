import { z } from "zod";
import { traceTurn } from "@/lib/chat/agent";
import { planTurn } from "@/lib/chat/plan";
import { MAX_TEXT_CHARS } from "@/lib/chat/validate";

export const maxDuration = 30;

const inspectSchema = z.object({
  question: z.string().trim().min(1).max(MAX_TEXT_CHARS),
  simulate: z.enum(["model-error"]).optional(),
});

/**
 * Runs the real agent once for a single test question and returns what it did:
 * retrieved sections, the exact source text given to the model, the media
 * decision and the answer. Nothing is stored.
 */
export async function POST(request: Request) {
  const parsed = inspectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: `Send a question between 1 and ${MAX_TEXT_CHARS} characters.` }, { status: 400 });
  }
  const plan = planTurn([{ role: "user", text: parsed.data.question }]);
  return Response.json(await traceTurn(plan, { simulate: parsed.data.simulate }));
}
