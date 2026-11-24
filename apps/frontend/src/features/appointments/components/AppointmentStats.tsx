"use client";

import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  CalendarCheck,
  XCircle,
  Users,
} from "lucide-react";

import { useAppointmentStats } from "../hooks";

const statConfig = [
  {
    key: "total",
    label: "Total Appointments",
    icon: CalendarDays,
    color: "text-[var(--color-brand-500)]",
    bg: "bg-[var(--color-brand-500)]/10",
  },
  {
    key: "today",
    label: "Today's Appointments",
    icon: Clock3,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    icon: CalendarCheck,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-500/10",
  },
  {
    key: "completed",
    label: "Completed",
    icon: Users,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-500/10",
  },
] as const;

export default function AppointmentStats() {
  const { data, isLoading, isError } = useAppointmentStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statConfig.map((stat) => (
          <div
            key={stat.key}
            className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          />
        ))}{" "}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20">
        Unable to load appointment statistics.{" "}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {statConfig.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.key}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>

                <p className="mt-2 text-2xl font-semibold text-[#1E293B] dark:text-white">
                  {data[stat.key]}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.bg}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
