import { MEDIA_CATALOG } from "@/lib/media/catalog";
import { WEBSITE_SOURCES } from "./snapshot";

/** Public, read-only view of what the assistant can use. Never includes keys or conversations. */
export function getKnowledgeSummary() {
  return {
    sources: WEBSITE_SOURCES.map((s) => ({
      id: s.id,
      title: s.title,
      url: s.url,
      capturedAt: s.capturedAt,
      sections: s.sections,
    })),
    media: MEDIA_CATALOG,
  };
}

export type KnowledgeSummary = ReturnType<typeof getKnowledgeSummary>;
