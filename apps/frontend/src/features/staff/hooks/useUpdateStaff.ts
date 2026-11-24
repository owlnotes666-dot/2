"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStaff } from "../api/staffService";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.all,
      });
    },
  });
}