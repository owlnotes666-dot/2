"use client";

import { CalendarDays } from "lucide-react";
import type { AnalyticsPeriod } from "../types";

interface AnalyticsDateFilterProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
}

const periods: {
  label: string;
  value: AnalyticsPeriod;
}[] = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 3 Months", value: "3m" },
  { label: "Last 6 Months", value: "6m" },
  { label: "This Year", value: "year" },
  { label: "Custom Range", value: "custom" },
];

export default function AnalyticsDateFilter({
  period,
  onPeriodChange,
}: AnalyticsDateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="mr-2 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
        <CalendarDays size={18} />
        <span>Date Range:</span>
      </div>

      {periods.map((item) => {
        const isActive = period === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onPeriodChange(item.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--color-brand-500)] text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}