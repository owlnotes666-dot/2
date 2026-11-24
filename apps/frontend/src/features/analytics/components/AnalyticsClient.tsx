"use client";

import AnalyticsStats from "./AnalyticsStats";
import PatientAnalyticsChart from "./PatientAnalyticsChart";
import AnalyticsDateFilter from "./AnalyticsDateFilter";
import CustomDateRangePicker from "./CustomDateRangePicker";
import AnalyticsRefreshButton from "./AnalyticsRefreshButton";
import AppointmentStatusChart from "./AppointmentStatusChart";
import MedicalRecordStatusChart from "./MedicalRecordStatusChart";

import { useAnalyticsDateRange } from "../hooks";

export default function AnalyticsClient() {
  const {
    period,
    setPeriod,
    dateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    dateRangeError,
    isCustomRangeValid,
  } = useAnalyticsDateRange();

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor your healthcare system performance and statistics.
          </p>
        </div>

        <AnalyticsRefreshButton />
      </div>

      {/* Date Filters */}
      <div className="space-y-4">
        <AnalyticsDateFilter period={period} onPeriodChange={setPeriod} />

        {period === "custom" && (
          <CustomDateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            onStartDateChange={setCustomStartDate}
            onEndDateChange={setCustomEndDate}
            error={dateRangeError}
          />
        )}
      </div>

      {/* Analytics Content */}
      {isCustomRangeValid ? (
        <>
          <AnalyticsStats dateRange={dateRange} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PatientAnalyticsChart dateRange={dateRange} />
            <AppointmentStatusChart dateRange={dateRange} />
            <MedicalRecordStatusChart dateRange={dateRange} />
          </div>
        </>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please select a valid date range to view analytics.
          </p>
        </div>
      )}
    </div>
  );
}
