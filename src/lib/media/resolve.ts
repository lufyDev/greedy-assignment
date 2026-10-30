import { MEDIA_CATALOG, type MediaItem } from "./catalog";
import type { MediaRequest, MediaSelection, UnavailableMedia } from "./types";

/**
 * Turns a media request into concrete catalog items. Anything we do not have
 * is reported in `unavailable` so the assistant can say so instead of
 * inventing a link.
 */
export function resolveMedia(request: MediaRequest, catalog: MediaItem[] = MEDIA_CATALOG): MediaSelection {
  const items: MediaItem[] = [];
  const unavailable: UnavailableMedia[] = [];

  if (request.otherExperience) {
    const reason = `We only have files for Sea View Skydiving, nothing for ${request.otherExperience} yet.`;
    if (request.pdf) unavailable.push({ kind: "pdf", reason });
    if (request.video) unavailable.push({ kind: "video", reason });
    return { items, unavailable };
  }

  if (request.pdf) {
    const brochure = catalog.find((m) => m.kind === "pdf");
    if (brochure) items.push(brochure);
    else unavailable.push({ kind: "pdf", reason: "No brochure is available right now." });
  }

  if (request.video) {
    const videos = catalog.filter((m) => m.kind === "video");
    if (request.packages.length === 0) {
      const general = videos.find((v) => !v.package);
      if (general) items.push(general);
      else unavailable.push({ kind: "video", reason: "No video of the experience is available right now." });
    } else {
      for (const pkg of request.packages) {
        const match = videos.find((v) => v.package === pkg);
        if (match) items.push(match);
        else
          unavailable.push({
            kind: "video",
            reason:
              pkg === "eco"
                ? "ECO is the jump only, with no video coverage, so there is no ECO video to share."
                : `There is no ${pkg.toUpperCase()} video available right now.`,
          });
      }
    }
  }

  return { items, unavailable };
}
