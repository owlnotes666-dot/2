import type { Metadata } from "next";

import { DashboardClient } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Overview | Medical Dashboard",
  description: "Overview",
};

export default function Dashboard() {
  return <DashboardClient />;
}
