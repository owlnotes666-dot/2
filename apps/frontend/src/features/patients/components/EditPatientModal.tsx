"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Modal from "@/shared/components/ui/common/Modal";
import { useUpdatePatient } from "../hooks/useUpdatePatient";
import {
  patientFormSchema,
  type PatientFormValues,
} from "../schemas/patientForm.schema";
import type { Patient } from "../types/patient.type";

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

const emptyFormValues: PatientFormValues = {
  full_name: "",
  age: "",
  gender: "",
  phone: "",
  email: "",
  condition: "",
  status: "Active",
};

export default function EditPatientModal({
  isOpen,
  onClose,
  patient,
}: EditPatientModalProps) {
  const updatePatient = useUpdatePatient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: emptyFormValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        full_name: patient.full_name,
        age: patient.age?.toString() ?? "",
        gender: patient.gender ?? "",
        phone: patient.phone ?? "",
        email: patient.email ?? "",
        condition: patient.condition ?? "",
        status: patient.status,
      });
    }
  }, [isOpen, patient, reset]);

  const onSubmit = (values: PatientFormValues) => {
    updatePatient.mutate(
      {
        id: patient.id,
        full_name: values.full_name,
        age: values.age ? Number(values.age) : null,
        gender: values.gender || null,
        phone: values.phone || null,
        email: values.email || null,
        condition: values.condition || null,
        status: values.status,
      },
      {
        onSuccess: () => {
          reset(emptyFormValues);
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    if (updatePatient.isPending) return;

    reset(emptyFormValues);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Patient"
      description="Update the patient's information."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {updatePatient.isError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            Failed to update patient: {updatePatient.error.message}
          </div>
        )}

        <div>
          <label
            htmlFor="edit-patient-full-name"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-patient-full-name"
            {...register("full_name")}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-red-500">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-patient-age"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Age
            </label>
            <input
              id="edit-patient-age"
              type="number"
              min="0"
              {...register("age")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            {errors.age && (
              <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="edit-patient-gender"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Gender
            </label>
            <select
              id="edit-patient-gender"
              {...register("gender")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-xs text-red-500">
                {errors.gender.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-patient-phone"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Phone
            </label>
            <input
              id="edit-patient-phone"
              type="tel"
              {...register("phone")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="edit-patient-email"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="edit-patient-email"
              type="email"
              {...register("email")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-patient-condition"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Medical Condition
          </label>
          <input
            id="edit-patient-condition"
            {...register("condition")}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
          {errors.condition && (
            <p className="mt-1 text-xs text-red-500">
              {errors.condition.message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={updatePatient.isPending}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updatePatient.isPending}
            className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updatePatient.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
