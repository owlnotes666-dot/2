import { useQuery } from "@tanstack/react-query";
import type { AnalyticsDateRange } from "../types";
import { analyticsService } from "../api";

export const useAnalytics = (dateRange: AnalyticsDateRange) =>
  useQuery({
    queryKey: ["analytics", "stats", dateRange.startDate, dateRange.endDate],
    queryFn: () => analyticsService.getAnalyticsStats(dateRange),
    staleTime: 5 * 60 * 1000,
  });