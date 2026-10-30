import { safeValidateUIMessages } from "ai";
import { streamReply, type ChatUIMessage } from "@/lib/chat/agent";
import { planTurn } from "@/lib/chat/plan";
import { parseChatRequest } from "@/lib/chat/validate";

export const maxDuration = 30;

const badRequest = (message: string) => new Response(message, { status: 400, headers: { "content-type": "text/plain" } });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const parsed = parseChatRequest(body);
  if (!parsed.ok) return badRequest(parsed.error);

  // Structural check of the UI messages before they reach the model. Client-sent
  // `system` / `tools` fields from the transport are ignored on purpose.
  const validated = await safeValidateUIMessages<ChatUIMessage>({ messages: parsed.data.messages });
  if (!validated.success) return badRequest("Invalid chat messages.");

  const plan = planTurn(parsed.lines);
  return streamReply({ plan, messages: validated.data, simulate: parsed.data.simulate, abortSignal: request.signal });
}
