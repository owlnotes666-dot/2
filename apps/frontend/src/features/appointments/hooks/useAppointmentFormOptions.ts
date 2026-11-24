import { useQuery } from "@tanstack/react-query";
import { appointmentService } from "../api";
import { queryKeys } from "@/shared/lib/queryKeys";

export const useAppointmentFormOptions = () =>
useQuery({
queryKey: queryKeys.appointments.formOptions(),
queryFn: appointmentService.getFormOptions,
staleTime: 5 * 60 * 1000,
});
