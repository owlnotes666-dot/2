"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  updateDoctorSchema,
  type UpdateDoctorFormValues,
} from "../schemas/doctor.schema";

import type { Doctor } from "../types/doctor.types";
import { useUpdateDoctor } from "../hooks/useUpdateDoctor";

interface EditDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor;
}

export default function EditDoctorModal({
  isOpen,
  onClose,
  doctor,
}: EditDoctorModalProps) {
  const updateDoctor = useUpdateDoctor();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateDoctorFormValues>({
    resolver: zodResolver(updateDoctorSchema),
    defaultValues: {
      id: doctor.id,
      full_name: doctor.full_name,
      specialty: doctor.specialty,
      email: doctor.email ?? "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        id: doctor.id,
        full_name: doctor.full_name,
        specialty: doctor.specialty,
        email: doctor.email ?? "",
      });
    }
  }, [isOpen, doctor, reset]);

  const onSubmit = (values: UpdateDoctorFormValues) => {
    updateDoctor.mutate(values, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Doctor
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update the doctor&apos;s information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updateDoctor.isPending}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="edit-doctor-full-name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>

            <input
              id="edit-doctor-full-name"
              {...register("full_name")}
              placeholder="Dr. John Smith"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-doctor-specialty"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Specialty
            </label>

            <input
              id="edit-doctor-specialty"
              {...register("specialty")}
              placeholder="Cardiology"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {errors.specialty && (
              <p className="mt-1 text-xs text-red-500">
                {errors.specialty.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-doctor-email"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>

            <input
              id="edit-doctor-email"
              type="email"
              {...register("email")}
              placeholder="doctor@example.com"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {updateDoctor.isError && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              Failed to update doctor: {updateDoctor.error.message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateDoctor.isPending}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updateDoctor.isPending}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateDoctor.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
