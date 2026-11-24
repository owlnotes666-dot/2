import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "../api";
import { queryKeys } from "@/shared/lib/queryKeys";

export const useDashboardStats = () =>
  useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: dashboardService.getStats,
  });

export const useAppointments = () =>
  useQuery({
    queryKey: queryKeys.dashboard.appointments,
    queryFn: dashboardService.appointments,
  });

export const useTodayAppointments = () =>
  useQuery({
    queryKey: queryKeys.dashboard.todayAppointments,
    queryFn: dashboardService.getTodayAppointments,
  });

export const useOperationsInsights = () =>
  useQuery({
    queryKey: queryKeys.dashboard.operationsInsights,
    queryFn: dashboardService.getOperationsInsights,
    staleTime: 60 * 1000,
  });
