import { Metadata } from "next";
import StaffClient from "@/features/staff/components/StaffClient";

export const metadata: Metadata = {
  title: "Staff | Medical Dashboard",
  description: "Manage hospital staff members.",
};

export default function StaffPage() {
  return <StaffClient />;
}
