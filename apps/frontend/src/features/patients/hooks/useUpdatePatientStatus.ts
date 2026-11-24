import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsService } from "../api/patients.service";

export function useUpdatePatientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsService.updatePatientStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
