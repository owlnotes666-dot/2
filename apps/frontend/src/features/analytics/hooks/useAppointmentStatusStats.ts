import { useQuery } from "@tanstack/react-query";
import type { AnalyticsDateRange } from "../types";
import { getAppointmentStatusStats } from "../api/analytics.service";

export const useAppointmentStatusStats = (
  dateRange: AnalyticsDateRange,
) =>
  useQuery({
    queryKey: [
      "analytics",
      "appointment-status-stats",
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () => getAppointmentStatusStats(dateRange),
    staleTime: 5 * 60 * 1000,
  });