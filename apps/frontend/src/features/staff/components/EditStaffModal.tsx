"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  updateStaffSchema,
  type UpdateStaffFormValues,
} from "../schemas/staff.schema";

import type { StaffMember } from "../types/staff.types";
import { useUpdateStaff } from "../hooks/useUpdateStaff";
import { STAFF_ROLES } from "../constants/staff.constants";

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember;
}

export default function EditStaffModal({
  isOpen,
  onClose,
  staff,
}: EditStaffModalProps) {
  const updateStaff = useUpdateStaff();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateStaffFormValues>({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      id: staff.id,
      full_name: staff.full_name,
      role: staff.role,
      email: staff.email ?? "",
      phone: staff.phone ?? "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        id: staff.id,
        full_name: staff.full_name,
        role: staff.role,
        email: staff.email ?? "",
        phone: staff.phone ?? "",
      });
    }
  }, [isOpen, staff, reset]);

  const onSubmit = (values: UpdateStaffFormValues) => {
    updateStaff.mutate({ ...values, email: values.email ?? "" }, {
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
              Edit Staff Member
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update the staff member&apos;s information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updateStaff.isPending}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="edit-staff-full-name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>

            <input
              id="edit-staff-full-name"
              {...register("full_name")}
              placeholder="John Smith"
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
              htmlFor="edit-staff-role"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Job Role
            </label>

            <select
              id="edit-staff-role"
              {...register("role")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a role</option>

              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {errors.role && (
              <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-staff-email"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>

            <input
              id="edit-staff-email"
              type="email"
              {...register("email")}
              placeholder="staff@example.com"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-staff-phone"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Phone Number
            </label>

            <input
              id="edit-staff-phone"
              type="tel"
              {...register("phone")}
              placeholder="+1 202 555 0101"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          {updateStaff.isError && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              Failed to update staff member: {updateStaff.error.message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateStaff.isPending}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updateStaff.isPending}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateStaff.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
