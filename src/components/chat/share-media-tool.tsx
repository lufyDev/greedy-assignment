"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { AlertTriangle } from "lucide-react";
import type { MediaRequest, MediaSelection } from "@/lib/media/types";
import { MediaSelectionView } from "./media-cards";
import { TypingIndicator } from "./markdown-text";

/** Renders the share_media tool result as PDF / video cards. */
export const ShareMediaToolUI: ToolCallMessagePartComponent<MediaRequest, MediaSelection> = ({ result, isError }) => {
  if (isError) {
    return (
      <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
        <AlertTriangle className="size-3.5" aria-hidden /> The files couldn&apos;t be loaded. Please try again.
      </p>
    );
  }
  if (!result) return <TypingIndicator label="Finding the files…" />;
  return <MediaSelectionView selection={result} />;
};
