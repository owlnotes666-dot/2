"use client";

import { useQuery } from "@tanstack/react-query";
import { getStaff } from "../api/staffService";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff.lists(),
    queryFn: getStaff,
    staleTime: 30 * 1000,
  });
}