import { useQuery } from "@tanstack/react-query";
import { getDoctors } from "../api/doctorService";

export function useDoctors() {
  return useQuery({
    queryKey: ["doctors", "list"],
    queryFn: getDoctors,
  });
}
