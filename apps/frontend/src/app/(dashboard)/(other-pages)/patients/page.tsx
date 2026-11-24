import { Metadata } from "next";

import PatientsClient from "@/features/patients/components/PatientsClient";

export const metadata: Metadata = {
  title: "Patients | Medical Dashboard",
  description: "Manage clinic patients",
};

export default function Patients() {
  return <PatientsClient />;
}
