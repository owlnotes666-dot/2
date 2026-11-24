"use client";

import { motion } from "framer-motion";
import { useOperationsInsights } from "..";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { useTheme } from "@/context/ThemeContext";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

export default function AIInsights() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data, isLoading, isError } = useOperationsInsights();

  const statusData = {
    labels: data?.appointmentDistribution.map((item) => item.status) ?? [],
    datasets: [
      {
        data: data?.appointmentDistribution.map((item) => item.count) ?? [],
        backgroundColor: isDark
          ? ["#7D93B3", "#C6AD7C", "#D28A91", "#9AA8BD"]
          : ["#526A8E", "#927448", "#AD5B5C", "#69778B"],
        borderWidth: 0,
      },
    ],
  };

  const departmentData = {
    labels: data?.departmentActivity.map((item) => item.specialty) ?? [],
    datasets: [
      {
        label: "Appointments",
        data: data?.departmentActivity.map((item) => item.appointments) ?? [],
        backgroundColor: isDark ? "#7D93B3" : "#526A8E",
        borderRadius: 6,
        maxBarThickness: 38,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    color: isDark ? "#B6B0A5" : "#625B53",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 18,
          color: isDark ? "#B6B0A5" : "#625B53",
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    color: isDark ? "#B6B0A5" : "#625B53",
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
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
      },
    },
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Clinic Operations Insights
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Operational analytics and items requiring attention.
        </p>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Unable to load clinic insights. Please try again.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Appointment Status */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Appointment Status Distribution
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Breakdown of appointments by current status.
            </p>

            <div className="mt-5 h-64">
              {isLoading ? (
                <div className="h-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ) : data?.appointmentDistribution.length ? (
                <Doughnut data={statusData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No appointment data available.
                </div>
              )}
            </div>
          </motion.div>

          {/* Department Activity */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Department Activity
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Appointment volume across medical specialties.
            </p>

            <div className="mt-5 h-64">
              {isLoading ? (
                <div className="h-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ) : data?.departmentActivity.length ? (
                <Bar data={departmentData} options={barOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No department data available.
                </div>
              )}
            </div>
          </motion.div>

          {/* Operational Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 xl:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Operational Alerts
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Items that may require administrative follow-up.
                </p>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                {data?.operationalAlerts.length ?? 0} Pending
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ) : data?.operationalAlerts.length ? (
                data.operationalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-500/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Patient: {alert.patientName}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      {alert.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  No operational alerts. Everything looks good.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
