"use client";

import { motion, type Variants } from "framer-motion";
import {
  AIInsights,
  MedicalMetrics,
  MonthlyAppointments,
  useAppointments,
  useDashboardStats,
} from "..";
import Loading from "@/shared/components/errors/LoadingState";
import { useErrorHandler } from "@/shared/hooks";
import TodaySchedule from "./TodaySchedule";

const welcomeContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 18,
      delay: 0.2,
    },
  },
};

export default function DashboardClient() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorData,
  } = useDashboardStats();

  const {
    data: appointments,
    isLoading: appointmentsLoading,
    isError: appointmentsError,
    error: appointmentsErrorData,
  } = useAppointments();

  useErrorHandler(statsError, statsErrorData);
  useErrorHandler(appointmentsError, appointmentsErrorData);

  if (statsLoading || appointmentsLoading) {
    return <Loading />;
  }

  if (statsError || appointmentsError || !stats || !appointments) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        variants={welcomeContainer}
        initial="hidden"
        animate="visible"
      >
        <div>
          <motion.p
            variants={fadeUp}
            className="text-sm font-medium text-teal-600 dark:text-teal-400"
          >
            CLINIC MANAGEMENT
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            Overview
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            Welcome back! Here&apos;s what&apos;s happening at your clinic
            today.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-4 flex flex-wrap gap-3">
            <motion.a
              href="/patients"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Add Patient
            </motion.a>

            <motion.a
              href="/appointments"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Schedule Appointment
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          variants={fadeLeft}
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <svg
            className="h-5 w-5 text-teal-600 dark:text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </motion.div>
      </motion.div>

      {/* Statistics */}
      <MedicalMetrics stats={stats} />

      {/* Appointment Analytics */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <MonthlyAppointments appointments={appointments} />
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <TodaySchedule />
        </div>
      </div>

      <AIInsights />
    </div>
  );
}
