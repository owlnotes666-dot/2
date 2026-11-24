"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { DocsIcon, EyeIcon, PatientIcon } from "@/icons";
import Loading from "@/app/loading";
import { useErrorHandler } from "@/shared/hooks";
import Modal from "@/shared/components/ui/common/Modal";
import { DataTablePagination } from "@/shared/components/data-table";
import { useIsAdmin } from "@/features/auth/hooks/useIsAdmin";

import { usePatients } from "../hooks/usePatients";
import { useCreatePatient } from "../hooks/useCreatePatient";
import { useUpdatePatientStatus } from "../hooks/useUpdatePatientStatus";
import EditPatientModal from "./EditPatientModal";
import {
  patientFormSchema,
  type PatientFormValues,
} from "../schemas/patientForm.schema";
import type { Patient } from "../types/patient.type";

const PATIENTS_PAGE_SIZE = 5;

export default function PatientsClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pageIndex, setPageIndex] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formError, setFormError] = useState("");

  const { data: isAdmin = false, isLoading: isAdminLoading } = useIsAdmin();

  const {
    data: patients = [],
    isLoading: loading,
    isError,
    error,
  } = usePatients();

  const createPatientMutation = useCreatePatient();
  const updateStatusMutation = useUpdatePatientStatus();

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors: validationErrors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      full_name: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      condition: "",
      status: "Active",
    },
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  useErrorHandler(isError, error);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient: Patient) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        patient.full_name.toLowerCase().includes(searchValue) ||
        (patient.email ?? "").toLowerCase().includes(searchValue) ||
        (patient.phone ?? "").includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const pageCount = Math.ceil(filteredPatients.length / PATIENTS_PAGE_SIZE);
  const currentPage = Math.min(pageIndex, Math.max(pageCount - 1, 0));
  const paginatedPatients = filteredPatients.slice(
    currentPage * PATIENTS_PAGE_SIZE,
    (currentPage + 1) * PATIENTS_PAGE_SIZE,
  );

  const activeCount = patients.filter(
    (patient: Patient) => patient.status === "Active",
  ).length;

  const inactiveCount = patients.filter(
    (patient: Patient) => patient.status !== "Active",
  ).length;

  const handleOpenAddModal = () => {
    if (!isAdmin || isAdminLoading) return;

    setFormError("");
    setIsAddModalOpen(true);
  };

  const handleStatusChange = (patient: Patient) => {
    if (!isAdmin || isAdminLoading || updateStatusMutation.isPending) return;

    updateStatusMutation.mutate({
      id: patient.id,
      status: patient.status === "Active" ? "Inactive" : "Active",
    });
  };

  const handleAddPatient = async (formData: PatientFormValues) => {
    if (!isAdmin || createPatientMutation.isPending) return;

    setFormError("");

    const age = formData.age ? Number(formData.age) : null;

    try {
      await createPatientMutation.mutateAsync({
        full_name: formData.full_name,
        age,
        gender: formData.gender || null,
        phone: formData.phone || null,
        email: formData.email || null,
        condition: formData.condition || null,
        status: formData.status,
      });

      reset();
      clearErrors();
      setIsAddModalOpen(false);
    } catch (insertError: unknown) {
      const error = insertError as {
        message?: string;
        code?: string;
        details?: string;
        hint?: string;
      };

      console.error("Add patient error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        rawError: insertError,
      });

      setFormError(
        error?.message || "Unable to add patient. Please try again.",
      );
    }
  };

  const closeAddModal = () => {
    if (createPatientMutation.isPending) return;

    setIsAddModalOpen(false);
    setFormError("");
    reset();
    clearErrors();
  };

  /* ------------------------------ Animations ------------------------------ */

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-animate='header-item']", {
        opacity: 0,
        y: 22,
        duration: 0.55,
        stagger: 0.09,
        clearProps: "all",
      })
        .from(
          "[data-animate='add-btn']",
          { opacity: 0, scale: 0.9, duration: 0.45, clearProps: "all" },
          "-=0.35",
        )
        .from(
          "[data-animate='card']",
          {
            opacity: 0,
            y: 34,
            scale: 0.96,
            duration: 0.55,
            stagger: 0.12,
            clearProps: "all",
          },
          "-=0.3",
        )
        .from(
          "[data-animate='table']",
          { opacity: 0, y: 30, duration: 0.6, clearProps: "all" },
          "-=0.35",
        );
    },
    { scope: rootRef, dependencies: [] },
  );

  useGSAP(
    () => {
      if (loading) return;

      const rows = rootRef.current?.querySelectorAll<HTMLElement>(
        "[data-animate='row']",
      );

      if (!rows || rows.length === 0) return;

      gsap.from(rows, {
        opacity: 0,
        y: 14,
        duration: 0.4,
        stagger: 0.045,
        ease: "power3.out",
        clearProps: "all",
      });
    },
    { scope: rootRef, dependencies: [loading, statusFilter, currentPage] },
  );

  const handleAddBtnEnter = () => {
    if (!isAdmin || isAdminLoading) return;

    gsap.to(addBtnRef.current, {
      scale: 1.04,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const handleAddBtnLeave = () => {
    gsap.to(addBtnRef.current, {
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const isAddButtonDisabled = !isAdmin || isAdminLoading;

  return (
    <div ref={rootRef} className="space-y-6">
      {/* Page Header */}{" "}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {" "}
        <div>
          {" "}
          <p
            data-animate="header-item"
            className="text-sm font-medium text-teal-600 dark:text-teal-400"
          >
            CLINIC MANAGEMENT{" "}
          </p>
          <h1
            data-animate="header-item"
            className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            Patients
          </h1>
          <p
            data-animate="header-item"
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            Manage patient information and medical details.
          </p>
        </div>
        {/* Add Patient Button - Visible for all roles, enabled only for Admin */}
        <button
          ref={addBtnRef}
          type="button"
          data-animate="add-btn"
          onClick={handleOpenAddModal}
          onMouseEnter={handleAddBtnEnter}
          onMouseLeave={handleAddBtnLeave}
          disabled={isAddButtonDisabled}
          title={
            isAddButtonDisabled
              ? "Only administrators can add patients."
              : "Add a new patient"
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-teal-600"
        >
          <span className="text-lg leading-none">+</span>
          Add Patient
        </button>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Patients"
          value={patients.length}
          icon={<PatientIcon />}
          accent="bg-blue-800 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
        />

        <SummaryCard
          title="Active Patients"
          value={activeCount}
          icon={<EyeIcon />}
          accent="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
        />

        <SummaryCard
          title="Other Statuses"
          value={inactiveCount}
          icon={<DocsIcon />}
          accent="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
        />
      </div>
      {/* Patients Table */}
      <div
        data-animate="table"
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              All Patients
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Patient directory and information
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white sm:w-64"
              />

              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageIndex(0);
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {updateStatusMutation.isError && (
          <div
            role="alert"
            className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            Failed to update patient status:{" "}
            {updateStatusMutation.error.message}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {[
                  "Patient",
                  "Age / Gender",
                  "Contact",
                  "Condition",
                  "Status",
                  "Registration Date",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                      heading === "Actions" ? "text-right" : ""
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading || isError ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <Loading />
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr data-animate="row">
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No patients found.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    data-animate="row"
                    className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
                          {patient.full_name
                            .split(" ")
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {patient.full_name}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {patient.email || "No email provided"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {patient.age ?? "—"} years
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {patient.gender || "Not specified"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {patient.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {patient.condition || "Not specified"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          patient.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            patient.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        />

                        {patient.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(patient.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPatient(patient)}
                          disabled={!isAdmin || isAdminLoading}
                          title={
                            isAdmin
                              ? "Edit patient"
                              : "Only administrators can edit patients."
                          }
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-teal-400 dark:hover:bg-teal-950/40"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(patient)}
                          disabled={
                            !isAdmin ||
                            isAdminLoading ||
                            updateStatusMutation.isPending
                          }
                          title={
                            isAdmin
                              ? `${patient.status === "Active" ? "Deactivate" : "Activate"} patient`
                              : "Only administrators can change patient status."
                          }
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            patient.status === "Active"
                              ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                              : "text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
                          }`}
                        >
                          {updateStatusMutation.isPending
                            ? "Updating..."
                            : patient.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !isError && (
          <div className="px-5 py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredPatients.length === 0
                  ? "0"
                  : `${currentPage * PATIENTS_PAGE_SIZE + 1}-${Math.min(
                      (currentPage + 1) * PATIENTS_PAGE_SIZE,
                      filteredPatients.length,
                    )}`}
              </span>{" "}
              of {filteredPatients.length} patients
            </p>
          </div>
        )}
        {!loading && !isError && (
          <DataTablePagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            showSinglePage
            variant="teal"
          />
        )}
      </div>
      {/* Add Patient Modal - Admin Only */}
      {isAdmin && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          title="Add New Patient"
          description="Enter the patient's information to create a new record."
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmit(handleAddPatient)} className="space-y-5">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              >
                {formError}
              </div>
            )}

            <div>
              <label
                htmlFor="full_name"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Full Name <span className="text-red-500">*</span>
              </label>

              <input
                id="full_name"
                {...register("full_name")}
                placeholder="Enter patient's full name"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />

              {validationErrors.full_name && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.full_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="age"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Age
                </label>

                <input
                  id="age"
                  type="number"
                  min="0"
                  {...register("age")}
                  placeholder="Enter age"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />

                {validationErrors.age && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.age.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Gender
                </label>

                <select
                  id="gender"
                  {...register("gender")}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                {validationErrors.gender && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.gender.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone
                </label>

                <input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />

                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />

                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="condition"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Medical Condition
              </label>

              <input
                id="condition"
                {...register("condition")}
                placeholder="Enter medical condition"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />

              {validationErrors.condition && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.condition.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Patient Status
              </label>

              <select
                id="status"
                {...register("status")}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              {validationErrors.status && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.status.message}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeAddModal}
                disabled={createPatientMutation.isPending}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createPatientMutation.isPending}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createPatientMutation.isPending ? "Saving..." : "Add Patient"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {isAdmin && selectedPatient && (
        <EditPatientModal
          isOpen={!!selectedPatient}
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  accent: string;
}

function SummaryCard({ title, value, icon, accent }: SummaryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [displayedValue, setDisplayedValue] = useState(0);

  useGSAP(
    () => {
      const counter = { val: displayedValue };

      gsap.to(counter, {
        val: value,
        duration: 1.1,
        ease: "power3.out",
        onUpdate: () => {
          setDisplayedValue(counter.val);
        },
      });
    },
    { dependencies: [value] },
  );

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { y: -6, duration: 0.35, ease: "power3.out" });

    gsap.to(iconRef.current, {
      keyframes: [
        { rotate: -12, scale: 1.18 },
        { rotate: 8, scale: 1.18 },
        { rotate: 0, scale: 1.18 },
      ],
      duration: 0.55,
      ease: "power2.inOut",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.35, ease: "power3.out" });

    gsap.to(iconRef.current, {
      rotate: 0,
      scale: 1,
      duration: 0.35,
      ease: "power3.out",
    });
  };

  return (
    <div
      ref={cardRef}
      data-animate="card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      {" "}
      <div className="flex items-center justify-between">
        {" "}
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}{" "}
        </p>
        <div
          ref={iconRef}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${accent}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {Math.round(displayedValue).toLocaleString()}
      </p>
    </div>
  );
}
