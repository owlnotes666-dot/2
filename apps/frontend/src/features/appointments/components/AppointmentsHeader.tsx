"use client";

import { Plus, CalendarDays } from "lucide-react";

interface Props {
  onAddAppointment: () => void;
  isAdmin: boolean;
}

export default function AppointmentsHeader({
  onAddAppointment,
  isAdmin,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-[var(--color-brand-500)]" />

          <h1 className="text-2xl font-semibold text-[var(--color-gray-900)] dark:text-white">
            Appointments
          </h1>
        </div>

        <p className="mt-1 text-sm text-[var(--color-gray-500)] dark:text-gray-400">
          Manage, track, and organize patient appointments.
        </p>
      </div>

      <button
        type="button"
        onClick={onAddAppointment}
        disabled={!isAdmin}
        title={
          !isAdmin
            ? "Admin access is required to schedule appointments."
            : "Schedule a new appointment"
        }
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium shadow-sm transition ${
          isAdmin
            ? "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]"
            : "cursor-not-allowed bg-gray-200 text-gray-500 opacity-70 dark:bg-gray-800 dark:text-gray-500"
        }`}
      >
        <Plus className="h-4 w-4" />
        Schedule Appointment
      </button>
    </div>
  );
}