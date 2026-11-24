import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMedicalRecordStatus } from "../api/medicalRecordService";
import type { UpdateMedicalRecordStatusInput } from "../types/medicalRecord.types";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useUpdateMedicalRecordStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMedicalRecordStatusInput) =>
      updateMedicalRecordStatus(input),

    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.medicalRecords.all,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.medicalRecords.detail(variables.id),
      });
    },
  });
}
