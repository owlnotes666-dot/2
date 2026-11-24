"use client";

import { CalendarDays, Clock3, UserRound, Stethoscope } from "lucide-react";

import { DataTablePagination } from "@/shared/components/data-table";

import type { AppointmentWithRelations } from "../types";

interface Props {
  appointments: AppointmentWithRelations[];
  onEdit?: (appointment: AppointmentWithRelations) => void;
  onCancel?: (appointment: AppointmentWithRelations) => void;
  isAdmin: boolean;
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const statusStyles: Record<string, string> = {
  Scheduled: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",

  Confirmed:
    "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",

  Completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",

  Cancelled: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",

  "No-show":
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");

  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function AppointmentsTable({
  appointments,
  onEdit,
  onCancel,
  isAdmin,
  totalCount,
  page,
  pageCount,
  pageSize,
  onPageChange,
}: Props) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <CalendarDays className="mx-auto h-10 w-10 text-gray-400" />

        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-white">
          No appointments found
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try changing your filters or schedule a new appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            <tr>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Patient
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Doctor
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Date &amp; Time
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Status
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {appointments.map((appointment) => (
              <tr
                key={appointment.id}
                className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/30"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]">
                      <UserRound className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {appointment.patients?.full_name ?? "Unknown Patient"}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {appointment.patients?.phone ?? "No phone number"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-gray-400" />

                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {appointment.doctors?.full_name ?? "Unknown Doctor"}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {appointment.doctors?.specialty ?? "General"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    {formatDate(appointment.appointment_date)}
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatTime(appointment.appointment_time)}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyles[appointment.status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit?.(appointment)}
                      disabled={!isAdmin || !onEdit}
                      title={
                        !isAdmin
                          ? "Admin access is required to edit appointments."
                          : "Edit appointment"
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        isAdmin
                          ? "text-[var(--color-brand-500)] hover:bg-[var(--color-brand-500)]/10"
                          : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-70 dark:bg-gray-800 dark:text-gray-500"
                      }`}
                    >
                      Edit
                    </button>

                    {appointment.status !== "Cancelled" && (
                      <button
                        type="button"
                        onClick={() => onCancel?.(appointment)}
                        disabled={!isAdmin || !onCancel}
                        title={
                          !isAdmin
                            ? "Admin access is required to cancel appointments."
                            : "Cancel appointment"
                        }
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          isAdmin
                            ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            : "cursor-not-allowed bg-gray-100 text-gray-400 opacity-70 dark:bg-gray-800 dark:text-gray-500"
                        }`}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {page * pageSize + 1}-
            {Math.min(page * pageSize + appointments.length, totalCount)}
          </span>{" "}
          of {totalCount} appointments
        </p>
      </div>
      <DataTablePagination
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
        showSinglePage
        variant="teal"
      />
    </div>
  );
}
