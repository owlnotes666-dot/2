"use client";

interface CustomDateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  error: string | null;
}

export default function CustomDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  error,
}: CustomDateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Start Date
        </label>

        <input
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          End Date
        </label>

        <input
          type="date"
          value={endDate}
          min={startDate}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>
      {error && (
        <p className="w-full text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
