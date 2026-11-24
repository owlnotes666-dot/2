import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsService } from "../api/patients.service";

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsService.updatePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
