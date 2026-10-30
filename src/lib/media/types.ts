import type { MediaItem, MediaKind } from "./catalog";

export type PackageId = "eco" | "deluxe" | "vip";

/** What the customer asked for in one message. */
export type MediaRequest = {
  pdf: boolean;
  video: boolean;
  /** Packages named in the message, used to pick a package-specific video. */
  packages: PackageId[];
  /** Another activity named in the message (e.g. "paragliding") that we have no files for. */
  otherExperience?: string;
};

export type UnavailableMedia = { kind: MediaKind; reason: string };

/** Result of the share_media tool, rendered as cards in the chat. */
export type MediaSelection = {
  items: MediaItem[];
  unavailable: UnavailableMedia[];
};
