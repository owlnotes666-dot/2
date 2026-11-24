import { useMemo, useState } from "react";
import type {
  AnalyticsDateRange,
  AnalyticsPeriod,
} from "../types";

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const getDateRange = (
  period: AnalyticsPeriod,
  customStartDate: string,
  customEndDate: string,
): AnalyticsDateRange => {
  const endDate = new Date();
  const startDate = new Date(endDate);

  if (period === "custom") {
    const customStart = parseDate(customStartDate);
    const customEnd = parseDate(customEndDate);

    if (!customStart || !customEnd || customStart > customEnd) {
      startDate.setDate(startDate.getDate() - 29);

      return {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    }

    customStart.setHours(0, 0, 0, 0);
    customEnd.setHours(23, 59, 59, 999);

    return {
      period,
      startDate: customStart.toISOString(),
      endDate: customEnd.toISOString(),
    };
  }

  switch (period) {
    case "7d":
      startDate.setDate(startDate.getDate() - 6);
      break;

    case "30d":
      startDate.setDate(startDate.getDate() - 29);
      break;

    case "3m":
      startDate.setMonth(startDate.getMonth() - 3);
      break;

    case "6m":
      startDate.setMonth(startDate.getMonth() - 6);
      break;

    case "year":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return {
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

export const useAnalyticsDateRange = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return formatLocalDate(date);
  });

  const [customEndDate, setCustomEndDate] = useState(() =>
    formatLocalDate(new Date()),
  );

  const dateRangeError = useMemo(() => {
    if (period !== "custom") return null;

    const start = parseDate(customStartDate);
    const end = parseDate(customEndDate);
    const today = parseDate(formatLocalDate(new Date()));

    if (!customStartDate || !customEndDate) {
      return "Please select both start and end dates.";
    }

    if (!start || !end) {
      return "Please enter valid dates.";
    }

    if (start > end) {
      return "Start date cannot be after end date.";
    }

    if (start > today! || end > today!) {
      return "Future dates are not allowed.";
    }

    return null;
  }, [period, customStartDate, customEndDate]);

  const dateRange = useMemo(
    () => getDateRange(period, customStartDate, customEndDate),
    [period, customStartDate, customEndDate],
  );

  return {
    period,
    setPeriod,
    dateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    dateRangeError,
    isCustomRangeValid: !dateRangeError,
  };
};