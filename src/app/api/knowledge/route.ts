import { getKnowledgeSummary } from "@/lib/knowledge";

/** Read-only JSON of the loaded website sources and media catalog. */
export function GET() {
  return Response.json(getKnowledgeSummary());
}
