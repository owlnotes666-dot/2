"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  appointmentSchema,
  type AppointmentFormValues,
} from "../schemas/appointmentSchema";
import { useAppointmentFormOptions } from "../hooks";
import type { AppointmentWithRelations } from "../types";

interface Props {
  appointment?: AppointmentWithRelations | null;
  isSubmitting?: boolean;
  onSubmit: (values: AppointmentFormValues) => void;
  onClose: () => void;
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/15 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const fieldErrorClass = "mt-1.5 text-xs text-red-500";

export default function AppointmentForm({
  appointment,
  isSubmitting = false,
  onSubmit,
  onClose,
}: Props) {
  const { data: options, isLoading, isError } = useAppointmentFormOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: "",
      doctor_id: "",
      appointment_date: "",
      appointment_time: "",
      status: "Scheduled",
    },
  });

  useEffect(() => {
    if (appointment) {
      reset({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time.slice(0, 5),
        status: appointment.status,
      });
    } else {
      reset({
        patient_id: "",
        doctor_id: "",
        appointment_date: "",
        appointment_time: "",
        status: "Scheduled",
      });
    }
  }, [appointment, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      {isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center gap-2 py-10 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-500)]" />
          Loading patients and doctors...
        </div>
      ) : isError || !options ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
          Unable to load patients and doctors. Please try again.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Patient */}
          <div>
            <label htmlFor="patient_id" className={labelClass}>
              Patient
            </label>
            <select
              id="patient_id"
              {...register("patient_id")}
              className={inputClass}
            >
              <option value="">Select a patient</option>
              {options.patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
            {errors.patient_id && (
              <p className={fieldErrorClass}>{errors.patient_id.message}</p>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label htmlFor="doctor_id" className={labelClass}>
              Doctor
            </label>
            <select
              id="doctor_id"
              {...register("doctor_id")}
              className={inputClass}
            >
              <option value="">Select a doctor</option>
              {options.doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name} — {doctor.specialty}
                </option>
              ))}
            </select>
            {errors.doctor_id && (
              <p className={fieldErrorClass}>{errors.doctor_id.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="appointment_date" className={labelClass}>
                Appointment Date
              </label>
              <input
                id="appointment_date"
                type="date"
                {...register("appointment_date")}
                className={inputClass}
              />
              {errors.appointment_date && (
                <p className={fieldErrorClass}>
                  {errors.appointment_date.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="appointment_time" className={labelClass}>
                Appointment Time
              </label>
              <input
                id="appointment_time"
                type="time"
                {...register("appointment_time")}
                className={inputClass}
              />
              {errors.appointment_time && (
                <p className={fieldErrorClass}>
                  {errors.appointment_time.message}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select id="status" {...register("status")} className={inputClass}>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-show">No-show</option>
            </select>
            {errors.status && (
              <p className={fieldErrorClass}>{errors.status.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || isLoading || isError || !options}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {appointment ? "Save Changes" : "Schedule Appointment"}
        </button>
      </div>
    </form>
  );
}
