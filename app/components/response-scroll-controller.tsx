"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import {
  AUTO_SCROLL_PARAM,
  AUTO_SCROLL_RESPONSE_VALUE,
} from "@/app/lib/auto-scroll";

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

export function ResponseScrollController({
  targetId,
  triggerParam = AUTO_SCROLL_PARAM,
  triggerValue = AUTO_SCROLL_RESPONSE_VALUE,
}: {
  targetId: string;
  triggerParam?: string;
  triggerValue?: string;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get(triggerParam) !== triggerValue) {
      return;
    }

    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: getScrollBehavior(),
      block: "start",
    });

    const url = new URL(window.location.href);
    url.searchParams.delete(triggerParam);

    const nextSearch = url.searchParams.toString();
    const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [searchParams, targetId, triggerParam, triggerValue]);

  return null;
}
