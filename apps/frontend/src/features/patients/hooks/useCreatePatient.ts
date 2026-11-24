import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsService } from "../api/patients.service";
import type { CreatePatientPayload } from "../types/patient.type";

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePatientPayload) =>
      patientsService.createPatient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
