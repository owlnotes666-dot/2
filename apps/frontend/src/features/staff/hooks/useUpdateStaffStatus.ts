"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStaffStatus } from "../api/staffService";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaffStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.all,
      });
    },
  });
}