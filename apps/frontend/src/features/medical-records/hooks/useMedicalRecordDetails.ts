"use client";

import { useQuery } from "@tanstack/react-query";

import { getMedicalRecordDetails } from "../api/medicalRecordService";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useMedicalRecordDetails(recordId: string | null) {
  return useQuery({
    queryKey: queryKeys.medicalRecords.detail(recordId ?? ""),
    queryFn: () => getMedicalRecordDetails(recordId!),
    enabled: Boolean(recordId),
    staleTime: 30 * 1000,
  });
}