import type { Metadata } from "next";

import DoctorsClient from "@/features/doctors/components/DoctorsClient";

export const metadata: Metadata = {
  title: "Doctors | Medical Dashboard",
  description: "Manage doctors and their information.",
};

export default function Doctors() {
  return <DoctorsClient />;
}
