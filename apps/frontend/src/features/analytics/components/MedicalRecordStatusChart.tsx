"use client";

import { useMedicalRecordStatusStats } from "../hooks";
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

interface MedicalRecordStatusChartProps {
  dateRange: AnalyticsDateRange;
}

export default function MedicalRecordStatusChart({
  dateRange,
}: MedicalRecordStatusChartProps) {
  const { theme } = useTheme();
  const { data, isLoading, isError } =
    useMedicalRecordStatusStats(dateRange);
  const statusColors = {
    Pending: theme === "dark" ? "#C6AD7C" : "#927448",
    Reviewed: theme === "dark" ? "#7D93B3" : "#526A8E",
    Completed: theme === "dark" ? "#8DB895" : "#4B8065",
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
          Failed to load medical records statistics.
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
    <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Medical Records Status
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Distribution of medical records by status.
        </p>
      </div>

      <div className="mx-auto h-[320px] max-w-[520px]">
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