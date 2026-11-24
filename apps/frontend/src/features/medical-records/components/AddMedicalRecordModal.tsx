"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  medicalRecordSchema,
  type MedicalRecordFormValues,
} from "../schemas/medicalRecord.schema";

import { useCreateMedicalRecord } from "../hooks/useCreateMedicalRecord";
import { usePatients } from "@/features/patients/hooks/usePatients";
import { useDoctors } from "@/features/doctors/hooks/useDoctors";

interface AddMedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMedicalRecordModal({
  isOpen,
  onClose,
}: AddMedicalRecordModalProps) {
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();

  const {
    mutateAsync,
    reset: resetMutation,
    isPending,
    isError,
    error,
  } = useCreateMedicalRecord();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      patient_id: "",
      doctor_id: "",
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      resetMutation();
    }
  }, [isOpen, resetForm, resetMutation]);

  if (!isOpen || typeof document === "undefined") return null;

  const onSubmit = async (values: MedicalRecordFormValues) => {
    try {
      await mutateAsync(values);
      resetForm();
      onClose();
    } catch {
      // Mutation error is displayed below the form.
    }
  };

  const isLoading = patientsLoading || doctorsLoading;
  const isSubmitting = isPending;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="medical-record-modal-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h2
              id="medical-record-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Add Medical Record
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a new patient medical record.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading patients and doctors...
              </div>
            </div>
          ) : (
            <>
              {/* Patient */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Patient <span className="text-red-500 dark:text-red-400">*</span>
                </label>

                <select
                  {...register("patient_id")}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a patient
                  </option>

                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>

                {errors.patient_id && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.patient_id.message}
                  </p>
                )}
              </div>

              {/* Doctor */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Doctor <span className="text-red-500 dark:text-red-400">*</span>
                </label>

                <select
                  {...register("doctor_id")}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a doctor
                  </option>

                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name} — {doctor.specialty}
                    </option>
                  ))}
                </select>

                {errors.doctor_id && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.doctor_id.message}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Record Title <span className="text-red-500 dark:text-red-400">*</span>
                </label>

                <input
                  {...register("title")}
                  type="text"
                  placeholder="e.g. Initial Medical Assessment"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />

                {errors.title && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>

                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder="Enter medical record details..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />

                {errors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Mutation Error */}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
              {error instanceof Error
                ? error.message
                : "Failed to create medical record. Please try again."}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isLoading ||
                isSubmitting ||
                patients.length === 0 ||
                doctors.length === 0
              }
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Record"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
