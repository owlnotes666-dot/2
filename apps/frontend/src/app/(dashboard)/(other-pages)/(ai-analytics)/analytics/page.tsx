import type { Metadata } from "next";

import AnalyticsClient from "@/features/analytics/components/AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics | Medical Dashboard",
  description: "Healthcare analytics and reports",
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}