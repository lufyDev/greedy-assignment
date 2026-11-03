"use client";

import { useEffect, type RefObject } from "react";

/**
 * Keeps the full-screen chat inside the area the on-screen keyboard leaves free.
 *
 * `fixed inset-0` follows the layout viewport, which the keyboard doesn't shrink
 * on every browser, so the browser pushes the panel up and its top can't be
 * reached. Android Chrome is also handled by `interactiveWidget` in the root
 * layout; iOS Safari needs this. The page behind the panel is locked meanwhile.
 */
export function useFitPhoneScreen(panelRef: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    const panel = panelRef.current;
    const viewport = window.visualViewport;
    if (!open || !panel || !viewport) return;

    const phone = window.matchMedia("(max-width: 639px)");
    const root = document.documentElement;

    const fit = () => {
      if (!phone.matches) {
        panel.style.removeProperty("top");
        panel.style.removeProperty("bottom");
        panel.style.removeProperty("height");
        root.style.removeProperty("overflow");
        return;
      }
      root.style.overflow = "hidden";
      if (viewport.scale > 1.01) return; // pinch zoom, not the keyboard
      panel.style.top = `${viewport.offsetTop}px`;
      panel.style.bottom = "auto";
      panel.style.height = `${viewport.height}px`;
    };

    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    phone.addEventListener("change", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
      phone.removeEventListener("change", fit);
      panel.style.removeProperty("top");
      panel.style.removeProperty("bottom");
      panel.style.removeProperty("height");
      root.style.removeProperty("overflow");
    };
  }, [panelRef, open]);
}
