"use client";

import { useEffect, type RefObject } from "react";

/**
 * Next keeps visited pages mounted but hidden when you navigate away (React
 * <Activity>), and a hidden <video> keeps playing, sound included. Effects are
 * cleaned up when a page is hidden, so that is where the video gets paused.
 */
export function usePauseWhenHidden(ref: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current;
    return () => video?.pause();
  }, [ref]);
}
