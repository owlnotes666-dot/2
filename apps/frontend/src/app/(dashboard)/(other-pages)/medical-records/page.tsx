import type { Metadata } from "next";
import MedicalRecordsClient from "@/features/medical-records/components/MedicalRecordsClient";

export const metadata: Metadata = {
  title: "Medical Records | Medical Dashboard",
  description: "Manage patient medical records.",
};

export default function MedicalRecordsPage() {
  return <MedicalRecordsClient />;
}