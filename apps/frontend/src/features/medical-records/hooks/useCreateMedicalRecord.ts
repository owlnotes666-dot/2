import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMedicalRecord } from "../api/medicalRecordService";
import type { CreateMedicalRecordInput } from "../types/medicalRecord.types";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMedicalRecordInput) =>
      createMedicalRecord(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.medicalRecords.all,
      });
    },
  });
}