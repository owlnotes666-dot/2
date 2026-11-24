"use client";

import { useAppointmentStatusStats } from "../hooks";
import type { AnalyticsDateRange } from "../types";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";
import { useTheme } from "@/context/ThemeContext";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AppointmentStatusChartProps {
  dateRange: AnalyticsDateRange;
}

export default function AppointmentStatusChart({
  dateRange,
}: AppointmentStatusChartProps) {
  const { theme } = useTheme();
  const { data, isLoading, isError } =
    useAppointmentStatusStats(dateRange);
  const statusColors = {
    Scheduled: theme === "dark" ? "#7D93B3" : "#526A8E",
    Completed: theme === "dark" ? "#8DB895" : "#4B8065",
    Cancelled: theme === "dark" ? "#D28A91" : "#AD5B5C",
  };

  if (isLoading) {
    return (
      <div className="h-[360px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  if (isError) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-red-200 bg-white dark:border-red-900 dark:bg-gray-900">
        <p className="text-sm text-red-500">
          Failed to load appointment statistics.
        </p>
      </div>
    );
  }

  const chartData = {
    labels: data?.map((item) => item.status) ?? [],
    datasets: [
      {
        data: data?.map((item) => item.total) ?? [],
        backgroundColor:
          data?.map((item) => statusColors[item.status]) ?? [],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Appointment Status
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Distribution of appointments by status.
        </p>
      </div>

      <div className="mx-auto h-[260px] max-w-[360px]">
        <Doughnut
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            color: theme === "dark" ? "#B6B0A5" : "#625B53",
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  color: theme === "dark" ? "#B6B0A5" : "#625B53",
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}