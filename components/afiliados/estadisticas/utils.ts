"use client";

import { useEffect, useState } from "react";

export const PIE_CORNER_RADIUS = 6;
export const PIE_PADDING_ANGLE = 2;

export function useChartTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return {
    isDark,
    pieStroke: isDark ? "#18181b" : "#ffffff",
    gridStroke: isDark ? "#3f3f46" : "#f0f0f0",
    axisTick: isDark ? "#a1a1aa" : "#9ca3af",
    axisLabel: isDark ? "#d4d4d8" : "#374151",
    emptySlice: isDark ? "#3f3f46" : "#e5e7eb",
    labelMuted: isDark ? "#a1a1aa" : "#6b7280",
    labelSecondary: isDark ? "#71717a" : "#6b7280",
    cursorFill: isDark ? "#27272a" : "#f9fafb",
    barLabel: isDark ? "#a1a1aa" : "#6b7280",
    barAccent: isDark ? "#818cf8" : "#6366f1",
    hombreLabel: isDark ? "#93c5fd" : "#1e40af",
    mujerLabel: isDark ? "#f9a8d4" : "#9d174d",
  };
}

export const chartStyles = {
  card: "flex w-full flex-col justify-start px-2 py-2 md:px-2 md:py-2.5",
  cardCompact: "flex w-full flex-col justify-start p-2 md:p-2.5",
  headerBlock:
    "mb-3 flex w-full shrink-0 flex-col items-center px-2 text-center",
  headerTitle:
    "text-xs md:text-xl font-bold text-gray-800 dark:text-zinc-100 uppercase",
  headerTitleSm:
    "text-xs md:text-lg font-bold text-gray-800 dark:text-zinc-100 uppercase text-center",
  headerSubtitle:
    "text-sm text-gray-500 dark:text-zinc-400 italic text-center",
  headerSubtitleLeft: "text-sm text-gray-500 dark:text-zinc-400 italic text-center",
  footer:
    "mt-4 shrink-0 border-t border-gray-100 px-2 pt-4 text-center text-[10px] font-bold uppercase text-gray-400 dark:border-zinc-800 dark:text-zinc-500",
  footerText: "text-gray-500 dark:text-zinc-400 mb-1",
  tooltip:
    "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-3 shadow-xl dark:shadow-black/40 text-[9px] z-50",
  tooltipTitle:
    "font-bold text-gray-800 dark:text-zinc-100 mb-2 border-b border-gray-100 dark:border-zinc-800 pb-1 uppercase",
  tooltipLabel: "text-gray-600 dark:text-zinc-400",
  tooltipValue: "text-gray-900 dark:text-zinc-100 text-xl",
};
