"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/app-store";
import type { PageKey } from "@/lib/constants";

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_PAGES: string[] = [
  "home", "plan", "productivity", "finance",
  "fitness", "nutrition", "wellness", "settings", "organization", "vision",
];

// (PLAN_TABS legacy removido — ahora planTab es string "today"|"week"|"month")

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildURL(page: string, tab?: string): string {
  const params = new URLSearchParams();
  if (page !== "home") params.set("page", page);
  if (tab) params.set("tab", tab);
  const search = params.toString();
  return search ? `/?${search}` : "/";
}

function currentURL(): string {
  return window.location.pathname + window.location.search;
}

function readURLParams(): { page: string; tab: string | undefined } {
  const params = new URLSearchParams(window.location.search);
  return {
    page: params.get("page") ?? "home",
    tab: params.get("tab") ?? undefined,
  };
}

function tabForPage(
  page: string,
  state: {
    wellnessSubTab: string;
    productivitySubTab: string;
    planTab: string;
    fitnessTab: string;
    financeTab: string;
    nutritionTab: string;
    organizationTab: string;
  }
): string | undefined {
  switch (page) {
    case "wellness":      return state.wellnessSubTab;
    case "productivity":  return state.productivitySubTab;
    case "plan":          return state.planTab;
    case "fitness":       return state.fitnessTab;
    case "finance":       return state.financeTab;
    case "nutrition":     return state.nutritionTab;
    case "organization":  return state.organizationTab;
    default:              return undefined;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRouteSync() {
  const activePage       = useAppStore((s) => s.activePage);
  const wellnessSubTab   = useAppStore((s) => s.wellnessSubTab);
  const productivitySubTab = useAppStore((s) => s.productivitySubTab);
  const planTab          = useAppStore((s) => s.planTab);
  const fitnessTab       = useAppStore((s) => s.fitnessTab);
  const financeTab       = useAppStore((s) => s.financeTab);
  const nutritionTab     = useAppStore((s) => s.nutritionTab);
  const organizationTab  = useAppStore((s) => s.organizationTab);
  const setPageFromURL   = useAppStore((s) => s.setPageFromURL);

  /**
   * When set to true, the next push-URL effect run is skipped.
   * This prevents the feedback loop: URL → setPageFromURL → state change → push URL.
   */
  const skipNextPushRef = useRef(false);

  /**
   * False until after the initial mount effects have run.
   * The push-URL effect is a no-op until then.
   */
  const mountedRef = useRef(false);

  // ── 1. Apply URL params on first mount ─────────────────────────────────────
  useEffect(() => {
    const { page, tab } = readURLParams();
    const validPage = VALID_PAGES.includes(page) ? (page as PageKey) : "home";

    if (page !== "home" || tab) {
      // Will trigger a state change → push-URL effect will see skipNextPushRef = true
      skipNextPushRef.current = true;
      setPageFromURL(validPage, tab);
    }

    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // ── 2. Respond to browser back / forward ──────────────────────────────────
  useEffect(() => {
    const handlePopState = () => {
      const { page, tab } = readURLParams();
      const validPage = VALID_PAGES.includes(page) ? (page as PageKey) : "home";
      skipNextPushRef.current = true;
      setPageFromURL(validPage, tab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setPageFromURL]);

  // ── 3. Push URL when app-store state changes ───────────────────────────────
  useEffect(() => {
    // Skip before initial mount effects have run (avoids double push on load)
    if (!mountedRef.current) return;

    // Skip when this change originated from a URL navigation
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }

    const tab = tabForPage(activePage, {
      wellnessSubTab,
      productivitySubTab,
      planTab,
      fitnessTab,
      financeTab,
      nutritionTab,
      organizationTab,
    });

    const url = buildURL(activePage, tab);

    // Only push if URL would actually change
    if (url !== currentURL()) {
      window.history.pushState(null, "", url);
    }
  }, [activePage, wellnessSubTab, productivitySubTab, planTab, fitnessTab, financeTab, nutritionTab, organizationTab]);
}
