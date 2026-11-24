import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import { appointmentService } from "../api/appointment.service";
import { queryKeys } from "@/shared/lib/queryKeys";

import type {
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../types";

export const useAppointments = (filters: AppointmentFilters = {}) =>
  useQuery({
    queryKey: queryKeys.appointments.list({ ...filters }),
    queryFn: () => appointmentService.getAppointments(filters),
    placeholderData: keepPreviousData,
  });

export const useAppointmentStats = () =>
  useQuery({
    queryKey: queryKeys.appointments.stats(),
    queryFn: appointmentService.getAppointmentStats,
  });

export const useAppointment = (id: string) =>
  useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => appointmentService.getAppointmentById(id),
    enabled: Boolean(id),
  });

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAppointmentInput) =>
      appointmentService.createAppointment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayAppointments,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.appointments,
      });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAppointmentInput) =>
      appointmentService.updateAppointment(input),
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(appointment.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayAppointments,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.appointments,
      });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayAppointments,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.appointments,
      });
    },
  });
};
