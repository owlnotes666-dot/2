import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnalyticsDateRange, AnalyticsPeriod } from "@/features/analytics";

// ─── Helpers ────────────────────────────────────────────────
function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

const FIXED_NOW = new Date("2025-06-15T12:00:00");

describe("useAnalyticsDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Initial State ────────────────────────────────────────
  it("should initialize with period '30d'", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    expect(result.current.period).toBe("30d");
    expect(result.current.dateRangeError).toBeNull();
    expect(result.current.isCustomRangeValid).toBe(true);
  });

  it("should initialize custom dates to last 30 days", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    const expectedStart = formatLocalDate(daysAgo(29));
    const expectedEnd = formatLocalDate(FIXED_NOW);

    expect(result.current.customStartDate).toBe(expectedStart);
    expect(result.current.customEndDate).toBe(expectedEnd);
  });

  // ─── Period: 7d ───────────────────────────────────────────
  it("should calculate correct range for '7d'", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("7d");
    });

    const start = new Date(result.current.dateRange.startDate);
    const end = new Date(result.current.dateRange.endDate);

    expect(result.current.dateRange.period).toBe("7d");
    expect(formatLocalDate(start)).toBe(formatLocalDate(daysAgo(6)));
    expect(formatLocalDate(end)).toBe(formatLocalDate(FIXED_NOW));
  });

  // ─── Period: 30d ──────────────────────────────────────────
  it("should calculate correct range for '30d'", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("30d");
    });

    const start = new Date(result.current.dateRange.startDate);

    expect(result.current.dateRange.period).toBe("30d");
    expect(formatLocalDate(start)).toBe(formatLocalDate(daysAgo(29)));
  });

  // ─── Period: 3m ───────────────────────────────────────────
  it("should calculate correct range for '3m'", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("3m");
    });

    const start = new Date(result.current.dateRange.startDate);
    const expected = new Date(FIXED_NOW);
    expected.setMonth(expected.getMonth() - 3);

    expect(result.current.dateRange.period).toBe("3m");
    expect(formatLocalDate(start)).toBe(formatLocalDate(expected));
  });

  // ─── Period: 6m ───────────────────────────────────────────
  it("should calculate correct range for '6m'", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("6m");
    });

    const start = new Date(result.current.dateRange.startDate);
    const expected = new Date(FIXED_NOW);
    expected.setMonth(expected.getMonth() - 6);

    expect(result.current.dateRange.period).toBe("6m");
    expect(formatLocalDate(start)).toBe(formatLocalDate(expected));
  });

  // ─── Period: year ─────────────────────────────────────────
  it("should calculate correct range for 'year' (from Jan 1)", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("year");
    });

    const start = new Date(result.current.dateRange.startDate);

    expect(result.current.dateRange.period).toBe("year");
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(0); // January
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  // ─── Custom Range (valid) ─────────────────────────────────
  it("should use custom dates when period is 'custom' and dates are valid", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("custom");
      result.current.setCustomStartDate("2025-03-01");
      result.current.setCustomEndDate("2025-03-31");
    });

    expect(result.current.dateRange.period).toBe("custom");
    expect(result.current.dateRangeError).toBeNull();
    expect(result.current.isCustomRangeValid).toBe(true);

    const start = new Date(result.current.dateRange.startDate);
    const end = new Date(result.current.dateRange.endDate);

    expect(formatLocalDate(start)).toBe("2025-03-01");
    expect(formatLocalDate(end)).toBe("2025-03-31");
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  // ─── Custom Range Validation Errors ───────────────────────
  it("should show error when start or end date is empty", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("custom");
      result.current.setCustomStartDate("");
      result.current.setCustomEndDate("2025-03-31");
    });

    expect(result.current.dateRangeError).toBe(
      "Please select both start and end dates.",
    );
    expect(result.current.isCustomRangeValid).toBe(false);
  });

  it("should show error for invalid date format", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("custom");
      result.current.setCustomStartDate("2025-13-40"); // invalid
      result.current.setCustomEndDate("2025-03-31");
    });

    expect(result.current.dateRangeError).toBe("Please enter valid dates.");
    expect(result.current.isCustomRangeValid).toBe(false);
  });

  it("should show error when start date is after end date", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("custom");
      result.current.setCustomStartDate("2025-04-10");
      result.current.setCustomEndDate("2025-03-01");
    });

    expect(result.current.dateRangeError).toBe(
      "Start date cannot be after end date.",
    );
    expect(result.current.isCustomRangeValid).toBe(false);
  });

  it("should show error when dates are in the future", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("custom");
      result.current.setCustomStartDate("2025-07-01"); // future
      result.current.setCustomEndDate("2025-07-15");
    });

    expect(result.current.dateRangeError).toBe("Future dates are not allowed.");
    expect(result.current.isCustomRangeValid).toBe(false);
  });

  // ─── Fallback when custom is invalid ──────────────────────
  it("should fallback to last 30 days when custom range is invalid", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("custom");
      result.current.setCustomStartDate("2025-05-20");
      result.current.setCustomEndDate("2025-04-01"); // start > end
    });

    // dateRange باید به حالت fallback برود
    const start = new Date(result.current.dateRange.startDate);
    expect(formatLocalDate(start)).toBe(formatLocalDate(daysAgo(29)));
    expect(result.current.dateRange.period).toBe("custom");
  });

  // ─── Switching periods clears error ───────────────────────
  it("should clear error when switching away from custom period", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    act(() => {
      result.current.setPeriod("custom");
      result.current.setCustomStartDate("invalid");
      result.current.setCustomEndDate("2025-03-31");
    });

    expect(result.current.dateRangeError).not.toBeNull();

    act(() => {
      result.current.setPeriod("7d");
    });

    expect(result.current.dateRangeError).toBeNull();
    expect(result.current.isCustomRangeValid).toBe(true);
  });

  // ─── setPeriod updates correctly ──────────────────────────
  it("should update period with setPeriod", () => {
    const { result } = renderHook(() => useAnalyticsDateRange());

    const periods: AnalyticsPeriod[] = [
      "7d",
      "30d",
      "3m",
      "6m",
      "year",
      "custom",
    ];

    periods.forEach((period) => {
      act(() => {
        result.current.setPeriod(period);
      });
      expect(result.current.period).toBe(period);
    });
  });
});
