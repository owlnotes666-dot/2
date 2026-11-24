import { useQuery } from "@tanstack/react-query";
import type { AnalyticsDateRange } from "../types";
import { analyticsService } from "../api";

export const usePatientMonthlyStats = (dateRange: AnalyticsDateRange) =>
  useQuery({
    queryKey: [
      "analytics",
      "patient-monthly-stats",
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () => analyticsService.getPatientMonthlyStats(dateRange),
    staleTime: 5 * 60 * 1000,
  });
