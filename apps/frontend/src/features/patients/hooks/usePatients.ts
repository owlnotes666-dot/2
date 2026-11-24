import { useQuery } from "@tanstack/react-query";
import { patientsService } from "../api/patients.service";

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: () => patientsService.getPatients(),
  });
}
