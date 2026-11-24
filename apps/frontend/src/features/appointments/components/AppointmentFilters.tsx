"use client";

import { Search, FilterX } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  AppointmentFilters as AppointmentFiltersType,
  AppointmentStatus,
} from "../types";

interface Props {
  filters: AppointmentFiltersType;
  onChange: (filters: AppointmentFiltersType) => void;
}

const statuses: (AppointmentStatus | "All")[] = [
  "All",
  "Scheduled",
  "Confirmed",
  "Completed",
  "Cancelled",
  "No-show",
];

export default function AppointmentFilters({ filters, onChange }: Props) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [doctorName, setDoctorName] = useState(filters.doctorName ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (filters.search ?? "")) {
        onChange({ ...filters, search: search.trim() || undefined });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (doctorName !== (filters.doctorName ?? "")) {
        onChange({
          ...filters,
          doctorName: doctorName.trim() || undefined,
        });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [doctorName]);

  const updateFilter = (key: keyof AppointmentFiltersType, value: string) => {
    onChange({
      ...filters,
      [key]: value === "All" || value === "" ? undefined : value,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setDoctorName("");
    onChange({});
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.doctorName || filters.date,
  );

  const inputClass =
    "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patient..."
            aria-label="Search patient"
            className={`${inputClass} pl-9`}
          />
        </div>

        <select
          value={filters.status ?? "All"}
          onChange={(event) => updateFilter("status", event.target.value)}
          aria-label="Filter by status"
          className={inputClass}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === "All" ? "All Statuses" : status}
            </option>
          ))}
        </select>

        <input
          type="search"
          value={doctorName}
          onChange={(event) => setDoctorName(event.target.value)}
          placeholder="Search doctor name..."
          aria-label="Search doctor name"
          className={inputClass}
        />

        <input
          type="date"
          value={filters.date ?? ""}
          onChange={(event) => updateFilter("date", event.target.value)}
          aria-label="Filter by appointment date"
          className={inputClass}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <FilterX className="h-4 w-4" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
