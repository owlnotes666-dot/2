"use client";

import { useTodayAppointments } from "../hooks";
import { dashboardService } from "../api";

type Appointment = Awaited<
  ReturnType<typeof dashboardService.getTodayAppointments>
>[number];

type RelatedPatient = {
  full_name: string;
} | null;

type RelatedDoctor = {
  full_name: string;
  specialty: string;
} | null;

function getStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "cancelled":
      return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    default:
      return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  }
}

export default function TodaySchedule() {
  const { data, isLoading, isError } = useTodayAppointments();

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 dark:border-gray-800 md:px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today&apos;s Schedule
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of today&apos;s appointments
          </p>
        </div>

        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
          Today
        </span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-500">
          Loading appointments...
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-sm text-red-500">
          Unable to load appointments.
        </div>
      ) : !data?.length ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No appointments scheduled for today.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((appointment: Appointment) => {
                const patient =
                  appointment.patients as unknown as RelatedPatient;

                const doctor = appointment.doctors as unknown as RelatedDoctor;

                return (
                  <tr
                    key={appointment.id}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {appointment.appointment_time.slice(0, 5)}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {patient?.full_name ?? "Unknown Patient"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {doctor?.full_name ?? "Unassigned"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {doctor?.specialty ?? "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(appointment.status ?? "scheduled")}`}
                      >
                        {appointment.status ?? "Scheduled"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
