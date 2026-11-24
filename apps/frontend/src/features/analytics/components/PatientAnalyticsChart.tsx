"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

import { usePatientMonthlyStats } from "../hooks";
import type { AnalyticsDateRange } from "../types";
import { useTheme } from "@/context/ThemeContext";

interface PatientAnalyticsChartProps {
  dateRange: AnalyticsDateRange;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

export default function PatientAnalyticsChart({
  dateRange,
}: PatientAnalyticsChartProps) {
  const { theme } = useTheme();
  const { data, isLoading, isError } = usePatientMonthlyStats(dateRange);
  const isDark = theme === "dark";

  if (isLoading) {
    return (
      <div className="h-[350px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-2xl border border-red-200 text-sm text-red-500">
        Failed to load patient analytics.
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "New Patients",
        data: data.map((item) => item.total),
        fill: true,
        backgroundColor: isDark
          ? "rgba(125, 147, 179, 0.2)"
          : "rgba(82, 106, 142, 0.12)",
        borderColor: isDark ? "#7D93B3" : "#526A8E",
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: isDark ? "#7D93B3" : "#526A8E",
        pointBorderColor: isDark ? "#202735" : "#fffdf8",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: isDark ? "#B6B0A5" : "#625B53",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#30313A" : "#202735",
        titleColor: isDark ? "#EEEAE1" : "#FFFD F8",
        bodyColor: isDark ? "#EEEAE1" : "#FFFD F8",
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? "#B6B0A5" : "#625B53" },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: isDark ? "#B6B0A5" : "#625B53",
        },
        grid: {
          color: isDark
            ? "rgba(182, 176, 165, 0.18)"
            : "rgba(98, 91, 83, 0.14)",
        },
        border: {
          display: false,
          dash: [4, 4],
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Patient Analytics
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          New patient registrations over the last 6 months
        </p>
      </div>

      <div className="h-[300px] w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
