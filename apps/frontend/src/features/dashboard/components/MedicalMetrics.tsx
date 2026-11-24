"use client";

import { motion, type Variants } from "framer-motion";

import { DoctorIcon, FileMedical, ScheduleIcon, PatientIcon } from "@/icons";

import type { DashboardStats } from "../types";

interface Props {
  stats: DashboardStats;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 16,
    },
  },
};

export default function MedicalMetrics({ stats }: Props) {
  const metrics = [
    {
      title: "Total Patients",
      value: stats.totalPatients ?? 0,
      growth: stats.patientsGrowth ?? 0,
      comparison: "vs. Previous Month",
      icon: PatientIcon,
      inverse: false,
      accent: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
    },
    {
      title: "Appointments Today",
      value: stats.appointmentsToday ?? 0,
      growth: stats.appointmentsGrowth ?? 0,
      comparison: "vs. Same Day Last Week",
      icon: ScheduleIcon,
      inverse: false,
      accent: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      title: "Active Doctors",
      value: stats.activeDoctors ?? 0,
      growth: stats.doctorsGrowth ?? 0,
      comparison: "vs. Previous Month",
      icon: DoctorIcon,
      inverse: false,
      accent:
        "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports ?? 0,
      growth: stats.reportsGrowth ?? 0,
      comparison: "vs. Previous Month",
      icon: FileMedical,
      inverse: true,
      accent:
        "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;

        const isPositive = metric.inverse
          ? metric.growth < 0
          : metric.growth > 0;

        const isNegative = metric.inverse
          ? metric.growth > 0
          : metric.growth < 0;

        const growthColor = isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : isNegative
            ? "text-red-600 dark:text-red-400"
            : "text-gray-500 dark:text-gray-400";

        const growthIcon =
          metric.growth > 0 ? "↑" : metric.growth < 0 ? "↓" : "•";

        return (
          <motion.div
            key={metric.title}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 md:p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {metric.title}
                </p>

                <h3 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {metric.value.toLocaleString()}
                </h3>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-semibold ${growthColor}`}
                  >
                    <span>{growthIcon}</span>
                    {Math.abs(metric.growth)}%
                  </span>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {metric.comparison}
                  </span>
                </div>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${metric.accent}`}
              >
                <span className="flex items-center justify-center [&_svg]:h-6 [&_svg]:w-6 [&_svg]:fill-current [&_svg]:stroke-current [&_path]:fill-current [&_path]:stroke-current">
                  <Icon />
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
