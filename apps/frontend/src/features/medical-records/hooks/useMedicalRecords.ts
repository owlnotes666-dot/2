import { useQuery } from "@tanstack/react-query";
import { getMedicalRecords } from "../api/medicalRecordService";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useMedicalRecords() {
  return useQuery({
    queryKey: queryKeys.medicalRecords.lists(),
    queryFn: getMedicalRecords,
  });
}