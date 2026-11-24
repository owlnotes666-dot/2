"use client";

import {
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  Activity,
} from "lucide-react";

import { useAnalytics } from "../hooks";
import type { AnalyticsDateRange } from "../types";

interface AnalyticsStatsProps {
  dateRange: AnalyticsDateRange;
}

const statsConfig = [
  {
    key: "totalPatients",
    title: "Total Patients",
    description: "Registered patients",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-500/10",
  },
  {
    key: "totalDoctors",
    title: "Total Doctors",
    description: "Registered doctors",
    icon: Stethoscope,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    key: "totalAppointments",
    title: "Total Appointments",
    description: "All appointments",
    icon: CalendarDays,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    key: "totalMedicalRecords",
    title: "Medical Records",
    description: "Total patient records",
    icon: FileText,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-500/10",
  },
  {
    key: "activeDoctors",
    title: "Active Doctors",
    description: "Currently active doctors",
    icon: Activity,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-500/10",
  },
  {
    key: "scheduledAppointments",
    title: "Scheduled Appointments",
    description: "Upcoming scheduled appointments",
    icon: CalendarDays,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  {
    key: "pendingMedicalRecords",
    title: "Pending Records",
    description: "Records awaiting review",
    icon: FileText,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-500/10",
  },
] as const;

export default function AnalyticsStats({
  dateRange,
}: AnalyticsStatsProps) {
  const { data, isLoading, isError } = useAnalytics(dateRange);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsConfig.map((item) => (
          <div
            key={item.key}
            className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
        Failed to load analytics statistics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statsConfig.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.key}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.title}
                </p>

                <h3 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {data[item.key].toLocaleString()}
                </h3>
              </div>

              <div className={`rounded-xl p-3 ${item.bg}`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}