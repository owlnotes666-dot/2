import { useQuery } from "@tanstack/react-query";

import type { AnalyticsDateRange } from "../types";
import { getMedicalRecordStatusStats } from "../api/analytics.service";

export const useMedicalRecordStatusStats = (
  dateRange: AnalyticsDateRange,
) =>
  useQuery({
    queryKey: [
      "analytics",
      "medical-record-status-stats",
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () => getMedicalRecordStatusStats(dateRange),
    staleTime: 5 * 60 * 1000,
  });