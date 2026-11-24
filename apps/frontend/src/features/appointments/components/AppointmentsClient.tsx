"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, type Variants } from "framer-motion";

import { useErrorHandler } from "@/shared/hooks/useErrorHandler";
import { useIsAdmin } from "@/features/auth/hooks/useIsAdmin";
import AppointmentStats from "./AppointmentStats";
import AppointmentFilters from "./AppointmentFilters";
import AppointmentsTable from "./AppointmentsTable";
import AppointmentForm from "./AppointmentForm";
import AppointmentsHeader from "./AppointmentsHeader";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
} from "../hooks";
import type {
  AppointmentFilters as AppointmentFiltersType,
  AppointmentWithRelations,
} from "../types";
import type { AppointmentFormValues } from "../schemas/appointmentSchema";
import { Modal } from "@/shared/components/modal";
import Loading from "@/app/loading";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

const APPOINTMENTS_PAGE_SIZE = 5;

export default function AppointmentsClient() {
  const [filters, setFilters] = useState<AppointmentFiltersType>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);

  const { data: isAdmin = false, isLoading: isAdminLoading } = useIsAdmin();

  const {
    data: appointments,
    isLoading,
    isError,
    error,
  } = useAppointments(filters);

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();

  useErrorHandler(isError, error);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const allAppointments = appointments ?? [];
  const pageCount = Math.ceil(allAppointments.length / APPOINTMENTS_PAGE_SIZE);
  const currentPage = Math.min(pageIndex, Math.max(pageCount - 1, 0));
  const paginatedAppointments = allAppointments.slice(
    currentPage * APPOINTMENTS_PAGE_SIZE,
    (currentPage + 1) * APPOINTMENTS_PAGE_SIZE,
  );

  const handleFiltersChange = (nextFilters: AppointmentFiltersType) => {
    setFilters(nextFilters);
    setPageIndex(0);
  };

  const openCreateModal = () => {
    if (!isAdmin || isAdminLoading) return;
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (appointment: AppointmentWithRelations) => {
    if (!isAdmin || isAdminLoading) return;
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleSubmit = async (values: AppointmentFormValues) => {
    if (!isAdmin || isAdminLoading) {
      toast.error("You don't have permission to modify appointments.");
      return;
    }

    try {
      if (selectedAppointment) {
        await updateMutation.mutateAsync({
          id: selectedAppointment.id,
          ...values,
        });
        toast.success("Appointment updated successfully.");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Appointment scheduled successfully.");
      }

      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch {
      toast.error("Unable to save appointment. Please try again.");
    }
  };

  const handleCancel = async (appointment: AppointmentWithRelations) => {
    if (!isAdmin || isAdminLoading) {
      toast.error("You don't have permission to cancel appointments.");
      return;
    }

    if (cancelMutation.isPending) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel the appointment for ${
        appointment.patients?.full_name ?? "this patient"
      }?`,
    );

    if (!confirmed) return;

    try {
      await cancelMutation.mutateAsync(appointment.id);
      toast.success("Appointment cancelled successfully.");
    } catch {
      toast.error("Unable to cancel appointment. Please try again.");
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <AppointmentsHeader
          onAddAppointment={openCreateModal}
          isAdmin={isAdmin && !isAdminLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <AppointmentStats />
      </motion.div>

      <motion.div variants={itemVariants}>
        <AppointmentFilters filters={filters} onChange={handleFiltersChange} />
      </motion.div>

      <motion.div variants={itemVariants}>
        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20">
            Unable to load appointments. Please refresh the page.
          </div>
        ) : (
          <AppointmentsTable
            appointments={paginatedAppointments}
            onEdit={openEditModal}
            onCancel={handleCancel}
            isAdmin={isAdmin && !isAdminLoading}
            totalCount={allAppointments.length}
            page={currentPage}
            pageCount={pageCount}
            pageSize={APPOINTMENTS_PAGE_SIZE}
            onPageChange={setPageIndex}
          />
        )}
      </motion.div>

      {isAdmin && !isAdminLoading && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          className="m-4 max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto"
        >
          <div className="p-5 sm:p-7">
            <div className="mb-6 border-b border-gray-100 pb-5 pr-12 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {selectedAppointment
                  ? "Edit Appointment"
                  : "Schedule Appointment"}
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {selectedAppointment
                  ? "Update the appointment details below."
                  : "Enter the details to schedule a new appointment."}
              </p>
            </div>
            <AppointmentForm
              appointment={selectedAppointment}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onClose={closeModal}
            />
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
